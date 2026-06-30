import Card from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getUIColors } from '@/constants/ui';
import { apiFetch, apiJson } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureToken, deleteSecureToken } from '../../services/secureStore';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AttendanceDetailsScreen() {
  const { isDarkMode } = useTheme();
  const C = getUIColors(isDarkMode);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [checkinsMap, setCheckinsMap] = useState<Record<string, any>>({});
  const [dayDetails, setDayDetails] = useState<any>(null);

  const getLocalDateStr = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useFocusEffect(
    useCallback(() => {
      const fetchAttendance = async () => {
        setLoading(true);
        try {
          const rawToken = await getSecureToken();
          const userId = await AsyncStorage.getItem('user_id');

          if (!rawToken || !userId) return;

          const authHeader = rawToken.trim();
          const commonHeaders: any = {
            Authorization: authHeader,
            sid: !authHeader.toLowerCase().includes('token') ? authHeader : undefined,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          };
          
          // Calculate start and end dates for the selected month
          const fromDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
          const toDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${new Date(selectedYear, selectedMonth + 1, 0).getDate()}`;

          // Fetch Attendance Status - using only this API per user request
          const attendRes = await apiFetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_attendance', {
            method: 'POST', body: { employee: userId.trim(), from_date: fromDate, to_date: toDate }
          });

          let finalAttendLogs = [];
          let status: number | null = null;
          if (attendRes) {
            try {
              status = attendRes.status;
              const result = await attendRes.json().catch(() => ({}));
              finalAttendLogs = result.message?.data || [];
              console.log('Attendance fetch status:', status, 'logs:', finalAttendLogs.length, finalAttendLogs[0]);
              setAttendanceLogs(finalAttendLogs);
            } catch (e) {
              console.warn('Failed parsing attendance response', e);
            }
            if (status === 417 || status === 401) {
              console.warn('Session expired while fetching attendance', status);
              await deleteSecureToken();
              await AsyncStorage.multiRemove(['user_id', 'employee_details']);
              router.replace('/');
              return;
            }
          }

          // Also fetch employee check-ins (used by dashboard) to derive IN/OUT when attendance API lacks times
          try {
            const { res: checkRes, json: checkData } = await apiJson('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_checkins', { method: 'POST', body: { employee: userId.trim() } });

            if (checkRes) {
              try {
                const checkStatus = checkRes.status;
                const extractLogs = (res: any): any[] => {
                if (!res) return [];
                if (Array.isArray(res)) return res;
                if (Array.isArray(res.message)) return res.message;
                if (res.message?.data && Array.isArray(res.message.data)) return res.message.data;
                if (res.message?.logs && Array.isArray(res.message.logs)) return res.message.logs;
                if (res.data && Array.isArray(res.data)) return res.data;
                return [];
              };

              const rawLogs = extractLogs(checkData) || [];
              const map: Record<string, any> = {};
              rawLogs.forEach((l: any) => {
                const timeVal = l.time || l.timestamp || l.log_time || l.created_at || l.date;
                if (!timeVal) return;
                const d = new Date(timeVal);
                if (isNaN(d.getTime())) return;
                const dateKey = getLocalDateStr(d);
                if (!map[dateKey]) map[dateKey] = { in: null, out: null, inRaw: null, outRaw: null, entries: [] };
                const entry = map[dateKey];
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const type = (l.log_type || l.type || '').toString().toUpperCase();
                entry.entries.push({ type, timeStr, raw: l });

                if (type === 'IN' || !entry.inRaw || d < entry.inRaw) {
                  if (entry.inRaw && d < entry.inRaw && !entry.outRaw) {
                    entry.out = entry.in;
                    entry.outRaw = entry.inRaw;
                  }
                  entry.in = timeStr;
                  entry.inRaw = d;
                }

                if (type === 'OUT' || !entry.outRaw || d > entry.outRaw) {
                  if (!entry.inRaw || d > entry.inRaw) {
                    entry.out = timeStr;
                    entry.outRaw = d;
                  }
                }
              });
              console.log('Checkins fetch status:', checkStatus, 'logs:', rawLogs.length);
              console.log('Checkins map built:', map);
              setCheckinsMap(map);
              if (checkStatus === 417 || checkStatus === 401) {
                console.warn('Session expired while fetching checkins', checkStatus);
                await deleteSecureToken();
                await AsyncStorage.multiRemove(['user_id', 'employee_details']);
                router.replace('/');
                return;
              }
              } catch (e) {
                console.warn('Failed parsing checkins response', e);
              }
            }
          } catch (e) {
            console.warn('Failed to fetch checkins fallback', e);
          }


          // CALCULATE STATS
          const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
          let lateCount = 0;
          const presentDates = new Set();
          const getHours = (str: string | null) => {
            if (!str || str === '--:--') return 0;
            const parts = str.includes(':') ? str.split(':') : str.split(' ');
            let h = parseInt(parts[0]) || 0;
            let m = parseInt(parts[1]) || 0;
            return h + (m / 60);
          };

          finalAttendLogs.forEach((l: any) => {
             const workHrs = getHours(l.total_working_hours);
             // If status is Present or there are punch times, mark as present
             if (l.status === 'Present' || (l.in_time && l.in_time !== '--:--') || (l.out_time && l.out_time !== '--:--')) {
                // If it's less than 8.5 hours, count as Late/Half Day
                if (workHrs > 0 && workHrs < 8.5) {
                   lateCount++;
                } else {
                   presentDates.add(l.attendance_date);
                }
             }
             if (l.status === 'Half Day') {
                lateCount++;
             }
          });
          

          let absents = 0;
          for (let d = 1; d <= totalDaysInMonth; d++) {
             const dateObj = new Date(selectedYear, selectedMonth, d);
             const dateStr = getLocalDateStr(dateObj);
             
             // Skip Sunday (0)
             if (dateObj.getDay() === 0) continue;
             
             // If not present and not a Sunday, it's an absent (unless it's a future date)
             const today = new Date();
             today.setHours(0,0,0,0);
             if (dateObj <= today && !presentDates.has(dateStr)) {
                absents++;
             }
          }

          setStats({ 
            present: presentDates.size, 
            absent: absents, 
            late: lateCount
          });
        } catch (e) {
          console.error('Failed to fetch attendance', e);
        } finally {
          setLoading(false);
        }
      };

      fetchAttendance();
    }, [selectedMonth, selectedYear, selectedDay])
  );

  

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026];

  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate dynamic week strip based on selected day/month/year + offset
  const getWeekDays = () => {
    const baseDate = new Date(selectedYear, selectedMonth, selectedDay);
    baseDate.setDate(baseDate.getDate() + (weekOffset * 7));
    
    const dayOfWeek = baseDate.getDay();
    const diff = baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Monday
    const monday = new Date(baseDate.getFullYear(), baseDate.getMonth(), diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      
      const belongsToCurrentMonth = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      
      if (!belongsToCurrentMonth) return null;

    const dateStr = getLocalDateStr(d);
    const log = attendanceLogs.find(l => l.attendance_date === dateStr);
      
      let status = log ? log.status : 'none';
      if (log && (log.in_time || log.out_time)) status = 'Present';
      
      // Force Sundays to NOT be absent
      if (d.getDay() === 0) {
         if (status === 'none' || status === 'Absent') status = 'Holiday';
      }
      
      return {
        name: d.toLocaleDateString('default', { weekday: 'short' }),
        date: d.getDate(),
        fullDate: d.toDateString(),
        isToday: d.toDateString() === new Date().toDateString(),
        status: status
      };
    });
  };

  // Merge details for the current day
    const getSelectedDayDetails = () => {
     const dateStr = getLocalDateStr(new Date(selectedYear, selectedMonth, selectedDay));
     // Try exact match first, then fallback to parsing attendance_date
     let attendLog = attendanceLogs.find(l => l.attendance_date === dateStr);
     if (!attendLog) {
      attendLog = attendanceLogs.find(l => {
        if (!l.attendance_date) return false;
        try {
         const d = new Date(l.attendance_date);
         return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === selectedDay;
        } catch (e) {
         return false;
        }
      });
     }

     const normalize = (timeStr: string | null | undefined) => {
       if (!timeStr) return null;
       // Convert ISO 'T' separators to space, trim
       const t = timeStr.replace('T', ' ').trim();
       return t;
     };

     const formatTime = (timeStr: string | null | undefined) => {
       const raw = normalize(timeStr);
       if (!raw || raw === '--:--' || raw === '-') return '--:--';
       // Split by space to handle '2026-05-09 08:47:26' or '08:47:26' or '08:47 AM'
       const parts = raw.split(' ');
       const timeOnly = parts.length > 1 ? parts[1] : parts[0];
       // If it's HH:MM:SS or HH:MM, return HH:MM
       const mm = timeOnly.substring(0,5);
       return mm;
     };

     // Use a more robust time formatter that matches home.tsx style
     const cleanTime = (raw: string | null | undefined) => {
       const n = normalize(raw);
       if (!n || n === '--:--' || n === '-') return '--:--';
       if (n.includes('AM') || n.includes('PM')) return n; // Already formatted
       // If it's a full timestamp '2024-05-08 09:00:00' or ISO '2024-05-08T09:00:00'
       if (n.length > 5 && (n.includes(' ') || n.includes('T'))) {
         const parts = n.split(' ');
         const timePart = parts.length > 1 ? parts[1] : parts[0];
         const [h, m] = timePart.split(':');
         const hr = parseInt(h);
         const ampm = hr >= 12 ? 'PM' : 'AM';
         const h12 = hr % 12 || 12;
         return `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
       }
       return n;
     };

    const calculateHours = (inT: string | null | undefined, outT: string | null | undefined) => {
       if (!inT || !outT || inT === '--:--' || outT === '--:--') return '--:--';
       
       const parseTime = (timeStr: string) => {
          const [time, ampm] = timeStr.split(' ');
          let [h, m] = time.split(':').map(Number);
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          return { h, m };
       };

       try {
          const start = parseTime(inT);
          const end = parseTime(outT);
          
          let diffMins = (end.h * 60 + end.m) - (start.h * 60 + start.m);
          if (diffMins < 0) return '--:--'; // Should not happen for same day

          const hrs = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} hrs`;
       } catch (e) {
          return '--:--';
       }
    };

    // Primary source: attendance API
    let inTime = cleanTime(attendLog?.in_time);
    let outTime = cleanTime(attendLog?.out_time);
    let apiWorkingHours = attendLog?.total_working_hours && attendLog.total_working_hours !== '--:--' 
       ? attendLog.total_working_hours 
       : calculateHours(inTime, outTime);

    // Fallback: if attendance API didn't provide in/out, try checkins map
    if ((!inTime || inTime === '--:--' || inTime === '-') && checkinsMap) {
      const ck = checkinsMap[getLocalDateStr(new Date(selectedYear, selectedMonth, selectedDay))];
      if (ck) {
        inTime = inTime && inTime !== '--:--' ? inTime : (ck.in || '--:--');
        outTime = outTime && outTime !== '--:--' ? outTime : (ck.out || '--:--');
        apiWorkingHours = apiWorkingHours && apiWorkingHours !== '--:--' ? apiWorkingHours : calculateHours(inTime, outTime);
      }
    }

    return {
      in_time: inTime,
      out_time: outTime,
      working_hours: apiWorkingHours,
      shift: attendLog?.shift || 'G Shift',
      status: attendLog?.status || 'none',
      raw: attendLog || null
    };
  };

  const dayDetailsMerged = getSelectedDayDetails();
  const weekDays = getWeekDays();
  const [dynamicWork, setDynamicWork] = useState<string | null>(null);

  useEffect(() => {
    let timer: any = null;

    const isTodaySelected = (() => {
      const today = new Date();
      return today.getFullYear() === selectedYear && today.getMonth() === selectedMonth && today.getDate() === selectedDay;
    })();

    const parseInToDate = (inStr: string | null) => {
      if (!inStr || inStr === '--:--' || inStr === '-') return null;
      const parts = inStr.trim().split(' ');
      const timePart = parts[0];
      const ampm = parts[1] ? parts[1].toUpperCase() : null;
      const [hhRaw, mmRaw] = timePart.split(':');
      let hh = parseInt(hhRaw || '0');
      const mm = parseInt(mmRaw || '0');
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      return new Date(selectedYear, selectedMonth, selectedDay, hh, mm, 0);
    };

    const update = () => {
      if (!isTodaySelected) {
        setDynamicWork(null);
        return;
      }
      const inStr = dayDetailsMerged.in_time;
      const outStr = dayDetailsMerged.out_time;
      if (!inStr || inStr === '--:--' || inStr === '-') {
        setDynamicWork(null);
        return;
      }

      // If checked out, show static working hours
      if (outStr && outStr !== '--:--' && outStr !== '-') {
        setDynamicWork(dayDetailsMerged.working_hours);
        return;
      }

      const inDate = parseInToDate(inStr);
      if (!inDate) {
        setDynamicWork(null);
        return;
      }

      const now = new Date();
      let diff = Math.max(0, now.getTime() - inDate.getTime());
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setDynamicWork(`${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
    };

    update();
    if (isTodaySelected && dayDetailsMerged.in_time && (!dayDetailsMerged.out_time || dayDetailsMerged.out_time === '--:--' || dayDetailsMerged.out_time === '-')) {
      timer = setInterval(update, 1000);
    }

    return () => { if (timer) clearInterval(timer); };
  }, [selectedDay, selectedMonth, selectedYear, attendanceLogs, dayDetailsMerged.in_time, dayDetailsMerged.out_time]);

  const handleWeekNav = (direction: number) => {
    const baseDate = new Date(selectedYear, selectedMonth, selectedDay);
    const dayOfWeek = baseDate.getDay();
    const currentMonday = new Date(selectedYear, selectedMonth, baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // Check if the current week has days from the OTHER month that are currently hidden
    // If it does, we first "switch" to reveal those days before moving to the next week
    const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      return d;
    });

    const hasOtherMonthDays = currentWeekDays.some(d => d.getMonth() !== selectedMonth);

    if (hasOtherMonthDays) {
       // Target month when moving in 'direction'
       const targetMonth = selectedMonth + direction;
       const targetDate = new Date(selectedYear, targetMonth, 1);
       
       // If we're moving PREV and the week has days from PREV month which are hidden
       if (direction < 0) {
          const firstDayOfCurrentMonth = new Date(selectedYear, selectedMonth, 1);
          if (currentMonday < firstDayOfCurrentMonth) {
             // We have hidden days from the previous month! Switch to them first.
             const prevMonthLastDay = new Date(selectedYear, selectedMonth, 0);
             setSelectedMonth(prevMonthLastDay.getMonth());
             setSelectedYear(prevMonthLastDay.getFullYear());
             setSelectedDay(prevMonthLastDay.getDate());
             return;
          }
       }
       
       // If we're moving NEXT and the week has days from NEXT month which are hidden
       if (direction > 0) {
          const lastDayOfCurrentMonth = new Date(selectedYear, selectedMonth + 1, 0);
          const sunday = new Date(currentMonday);
          sunday.setDate(currentMonday.getDate() + 6);
          
          if (sunday > lastDayOfCurrentMonth) {
             // We have hidden days from the next month! Switch to them first.
             const nextMonthFirstDay = new Date(selectedYear, selectedMonth + 1, 1);
             setSelectedMonth(nextMonthFirstDay.getMonth());
             setSelectedYear(nextMonthFirstDay.getFullYear());
             setSelectedDay(nextMonthFirstDay.getDate());
             return;
          }
       }
    }

    // Shift the whole week
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + (direction * 7));
    
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    
    // Check if the NEW week contains ANY days of the CURRENT selected month
    let containsCurrentMonth = false;
    for (let i = 0; i < 7; i++) {
       const d = new Date(nextMonday);
       d.setDate(nextMonday.getDate() + i);
       if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
          containsCurrentMonth = true;
          break;
       }
    }

    if (containsCurrentMonth) {
       // Stay in current month, just update the selected day to one of the days in the new week that is in this month
       let bestDay = nextMonday.getDate();
       for (let i = 0; i < 7; i++) {
          const d = new Date(nextMonday);
          d.setDate(nextMonday.getDate() + i);
          if (d.getMonth() === selectedMonth) {
             bestDay = d.getDate();
             if (direction > 0) break; // First day of month in week
             // if direction < 0, we want the last day of month in week (handled by loop continuing)
          }
       }
       setSelectedDay(bestDay);
    } else {
       // All days are in a different month, switch month
       // Find a representative day in the new week (middle day)
       const midDay = new Date(nextMonday);
       midDay.setDate(nextMonday.getDate() + 3);
       
       setSelectedMonth(midDay.getMonth());
       setSelectedYear(midDay.getFullYear());
       setSelectedDay(midDay.getDate());
    }
  };

  const teamData = [
    { name: 'Virendrakumar C.', time: '3h ago', status: 'Active', statusColor: '#4CAF50' },
    { name: 'Parth D. Panchal.', time: '3h ago', status: 'Active', statusColor: '#4CAF50' },
    { name: 'Kishan S. Rathod.', time: '4h ago', status: 'On Break', statusColor: '#FF9800' },
  ];

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />
      
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.card }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: C.gray50 }]}>
                <IconSymbol name="arrow.left" size={20} color={C.primarySoft} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: C.text }]}>Attendance Tracker</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>

        
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
      >
          <View style={styles.monthHeader}>
            <TouchableOpacity 
             style={[styles.monthSelector, { backgroundColor: C.card, borderColor: C.gray100, borderWidth: 1 }]}
             onPress={() => setMonthPickerVisible(true)}
            >
              <IconSymbol name="calendar" size={16} color={C.primarySoft} />
              <Text style={[styles.monthText, { color: C.text }]}>{months[selectedMonth]} {selectedYear}</Text>
              <IconSymbol name="chevron.down" size={14} color={C.subText} />
            </TouchableOpacity>
          </View>

        <View style={[styles.calendarCard, { backgroundColor: C.card }]}>
          <View style={styles.weekContainer}>
            <TouchableOpacity 
              style={styles.navBtn} 
              onPress={() => handleWeekNav(-1)}
            >
              <IconSymbol name="chevron.left" size={18} color={C.subText} />
            </TouchableOpacity>

            <View style={styles.weekDaysRow}>
              {weekDays.map((day, index) => (
                <View key={index} style={styles.dayColumn}>
                  <Text style={[styles.weekDayName, { color: C.subText }]}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</Text>
                  {day ? (
                    <TouchableOpacity 
                      style={[
                        styles.dateCircle,
                        selectedDay === day.date && { backgroundColor: C.primary },
                        day.isToday && selectedDay !== day.date && { borderColor: C.primary, borderWidth: 1.2 },
                      ]}
                      onPress={() => setSelectedDay(day.date)}
                    >
                      <Text style={[
                        styles.dateText,
                        { color: selectedDay === day.date ? '#FFFFFF' : day.isToday ? C.primary : C.text }
                      ]}>{day.date}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.dateCircle} />
                  )}
                  <View style={styles.dotRow}>
                    {day?.status === 'Present' && <View style={[styles.presentDot, { backgroundColor: C.success }]} />}
                    {day?.status === 'Absent' && <View style={[styles.presentDot, { backgroundColor: C.danger }]} />}
                    {day?.status === 'Half Day' && <View style={[styles.presentDot, { backgroundColor: C.warning }]} />}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.navBtn} 
              onPress={() => handleWeekNav(1)}
            >
              <IconSymbol name="chevron.right" size={18} color={C.subText} />
            </TouchableOpacity>
          </View>
        </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: C.card, borderColor: C.gray100, borderWidth: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: C.success + '15' }]}>
                 <IconSymbol name="checkmark.circle.fill" size={20} color={C.successSoft} />
              </View>
              <Text style={[styles.statNum, { color: C.text }]}>{stats.present}</Text>
              <Text style={[styles.statLab, { color: C.subText }]}>PRESENT</Text>
           </View>
            <View style={[styles.statItem, { backgroundColor: C.card, borderColor: C.gray100, borderWidth: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: C.danger + '15' }]}>
                 <IconSymbol name="xmark.circle.fill" size={20} color={C.dangerSoft} />
              </View>
              <Text style={[styles.statNum, { color: C.text }]}>{stats.absent}</Text>
              <Text style={[styles.statLab, { color: C.subText }]}>ABSENT</Text>
           </View>
            <View style={[styles.statItem, { backgroundColor: C.card, borderColor: C.gray100, borderWidth: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: C.warning + '15' }]}>
                <IconSymbol name="clock.fill" size={20} color={C.warningSoft} />
              </View>
              <Text style={[styles.statNum, { color: C.text }]}>{stats.late}</Text>
              <Text style={[styles.statLab, { color: C.subText }]}>HALF DAY</Text>
            </View>

           
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Day Details - {months[selectedMonth]} {selectedDay}</Text>
        </View>

        <Card style={[styles.detailCard, { backgroundColor: C.card }]}>
           <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                      <View style={[styles.detailIcon, { backgroundColor: C.primary + '10' }]}>
                        <IconSymbol name="arrow.down.left.circle.fill" size={22} color={C.primarySoft} />
                 </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={[styles.detailLabel, { color: C.subText }]}>IN</Text>
                      <Text style={[styles.detailValue, { color: C.text }]}> { (dayDetailsMerged.in_time && dayDetailsMerged.in_time !== '--:--') ? dayDetailsMerged.in_time : (dayDetailsMerged.raw?.in_time || dayDetailsMerged.raw?.in || dayDetailsMerged.raw?.check_in || '--:--') }</Text>
                    </View>
              </View>
              <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: C.danger + '10' }]}>
                    <IconSymbol name="arrow.up.right.circle.fill" size={22} color={C.dangerSoft} />
                  </View>
                 <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: C.subText }]}>OUT</Text>
                    <Text style={[styles.detailValue, { color: C.text }]}>{ (dayDetailsMerged.out_time && dayDetailsMerged.out_time !== '--:--') ? dayDetailsMerged.out_time : (dayDetailsMerged.raw?.out_time || dayDetailsMerged.raw?.out || dayDetailsMerged.raw?.check_out || '--:--') }</Text>
                 </View>
              </View>
           </View>
           
           <View style={[styles.divider, { backgroundColor: C.gray100 }]} />
           
           <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: '#4CAF5010' }]}>
                    <IconSymbol name="timer" size={22} color={C.successSoft} />
                  </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={[styles.detailLabel, { color: C.subText }]}>WORKING</Text>
                        <Text style={[styles.detailValue, { color: C.text }]}>{dynamicWork ?? ((dayDetailsMerged.working_hours && dayDetailsMerged.working_hours !== '--:--') ? dayDetailsMerged.working_hours : (dayDetailsMerged.raw?.total_working_hours || dayDetailsMerged.raw?.total_hours || '--:--'))}</Text>
                      </View>
              </View>
              <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: '#FF980010' }]}>
                    <IconSymbol name="bell.fill" size={22} color={C.warningSoft} />
                  </View>
                 <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: C.subText }]}>SHIFT</Text>
                    <Text style={[styles.detailValue, { color: C.text }]}>{dayDetailsMerged.shift}</Text>
                 </View>
              </View>
           </View>
        </Card>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Who's Working Now</Text>
        </View>

        <View style={styles.teamList}>
           {teamData.map((member, i) => (
             <View key={i} style={[styles.memberCard, { backgroundColor: C.card }]}>
                <View style={styles.memberLeft}>
                   <View style={[styles.memberAvatar, { backgroundColor: C.primary + '10' }]}>
                      <Text style={[styles.memberInitial, { color: C.primary }]}>{member.name.charAt(0)}</Text>
                   </View>
                   <View style={{ maxWidth: width * 0.4 }}>
                      <Text style={[styles.memberName, { color: C.text }]} numberOfLines={1}>{member.name}</Text>
                      <Text style={[styles.memberTime, { color: C.subText }]}>Logged in: {member.time}</Text>
                   </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: member.statusColor + '10' }]}>
                   <View style={[styles.statusDot, { backgroundColor: member.statusColor }]} />
                   <Text style={[styles.statusText, { color: member.statusColor }]}>{member.status}</Text>
                </View>
             </View>
           ))}
        </View>
      </ScrollView>

      {/* Month & Year Picker Modal */}
      <Modal visible={monthPickerVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMonthPickerVisible(false)}>
          <View style={[styles.pickerCard, { backgroundColor: C.card }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: C.text }]}>Select Month & Year</Text>
            </View>
            
            <View style={styles.pickerContent}>
              <View style={styles.pickerColumn}>
                <Text style={[styles.columnLabel, { color: C.subText }]}>MONTH</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {months.map((m, i) => (
                    <TouchableOpacity 
                      key={m} 
                      style={[styles.pickerOption, selectedMonth === i && { backgroundColor: C.primary + '15' }]}
                      onPress={() => setSelectedMonth(i)}
                    >
                      <Text style={[styles.optionText, { color: selectedMonth === i ? C.primary : C.text }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={[styles.columnLabel, { color: C.subText }]}>YEAR</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {years.map(y => (
                    <TouchableOpacity 
                      key={y} 
                      style={[styles.pickerOption, selectedYear === y && { backgroundColor: C.primary + '15' }]}
                      onPress={() => setSelectedYear(y)}
                    >
                      <Text style={[styles.optionText, { color: selectedYear === y ? C.primary : C.text }]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.doneBtn, { backgroundColor: C.primary }]}
              onPress={() => setMonthPickerVisible(false)}
            >
              <Text style={styles.doneBtnText}>Apply Selection</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  headerContainer: { backgroundColor: 'transparent', zIndex: 10 },
  headerBg: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  content: { flex: 1 },
  monthHeader: { paddingHorizontal: 20, marginBottom: 15 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, gap: 10, elevation: 0 },
  monthText: { fontSize: 14, fontWeight: '800' },
  calendarCard: { marginHorizontal: 20, borderRadius: 20, padding: 10, elevation: 0 },
  weekContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 30, height: 60, alignItems: 'center', justifyContent: 'center' },
  weekDaysRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  dayColumn: { alignItems: 'center' },
  weekDayName: { fontSize: 10, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  dateCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2, backgroundColor: 'transparent' },
  dateText: { fontSize: 13, fontWeight: '800' },
  dotRow: { height: 4, justifyContent: 'center' },
  presentDot: { width: 4, height: 4, borderRadius: 2 },
  statsGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 18 },
  statItem: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', gap: 6, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, borderWidth: 1, borderColor: 'transparent' },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statNum: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  statLab: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  detailCard: { marginHorizontal: 20, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 16, elevation: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, borderWidth: 1, borderColor: 'transparent' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  detailIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, fontWeight: '900' },
  divider: { height: 1, marginVertical: 12 },
  teamList: { paddingHorizontal: 20, gap: 12 },
  memberCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 18, elevation: 0, borderWidth: 1, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 16, fontWeight: '800' },
  memberName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  memberTime: { fontSize: 11, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerCard: { width: width * 0.85, borderRadius: 30, padding: 25, elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  pickerHeader: { marginBottom: 20, alignItems: 'center' },
  pickerTitle: { fontSize: 18, fontWeight: '800' },
  pickerContent: { flexDirection: 'row', height: 200, marginBottom: 25 },
  pickerColumn: { flex: 1, paddingHorizontal: 5 },
  columnLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  pickerOption: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, marginBottom: 4, alignItems: 'center' },
  optionText: { fontSize: 14, fontWeight: '700' },
  doneBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#4361EE', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  doneBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
