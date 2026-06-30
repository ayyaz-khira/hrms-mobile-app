import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getSecureToken } from '../services/secureStore';



export default function GatePassScreen() {
  const { isDarkMode } = useTheme();
  const [reason, setReason] = useState('');
  const [outTime, setOutTime] = useState('01:30 PM');
  const [inTime, setInTime] = useState('02:30 PM');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'out' | 'in'>('out');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterStart, setFilterStart] = useState<Date | null>(null);
  const [filterEnd, setFilterEnd] = useState<Date | null>(null);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [filterPickerType, setFilterPickerType] = useState<'start' | 'end'>('start');

  // New states for employee details and eligibility checking
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [approver, setApprover] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Absent' | 'Half Day' | 'Checking' | 'Not Checked' | 'Error'>('Not Checked');
  const [checkInTime, setCheckInTime] = useState('--:--');
  const [checkOutTime, setCheckOutTime] = useState('--:--');
  const [checkingAttendance, setCheckingAttendance] = useState(false);
  const [maxGatePasses, setMaxGatePasses] = useState(0);
  const [maxGatePassSeconds, setMaxGatePassSeconds] = useState(0);

  useEffect(() => {
    const loadEmployeeDetails = async () => {
      try {
        const cached = await AsyncStorage.getItem('employee_details');
        if (cached) {
          const data = JSON.parse(cached);
          setEmployeeId(data.name ?? '');
          setEmployeeName(data.employee_name ?? '');
          const appr = data.leave_approver;
          const approverVal = typeof appr === 'string' ? appr : appr?.employee_name || appr?.name || appr?.email || '';
          setApprover(approverVal);
          setMaxGatePasses(data.custom_gate_pass_per_month ?? 0);
          setMaxGatePassSeconds(data.monthly_gate_pass_hours_ ?? 0);
        }

        const userId = await AsyncStorage.getItem('user_id');
        const token = await getSecureToken();
        if (userId && token) {
          const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_details', {
            method: 'POST',
            headers: {
              'Authorization': token.trim(),
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ employee: userId.trim() })
          });

          const result = await response.json();
          if (response.ok && result.message) {
            await AsyncStorage.setItem('employee_details', JSON.stringify(result.message));
            const data = result.message;
            setEmployeeId(data.name ?? '');
            setEmployeeName(data.employee_name ?? '');
            const appr = data.leave_approver;
            const approverVal = typeof appr === 'string' ? appr : appr?.employee_name || appr?.name || appr?.email || '';
            setApprover(approverVal);
            setMaxGatePasses(data.custom_gate_pass_per_month ?? 0);
            setMaxGatePassSeconds(data.monthly_gate_pass_hours_ ?? 0);
          }
        }
      } catch (err) {
        console.warn('Failed to load employee details in GatePassScreen:', err);
      }
    };

    loadEmployeeDetails();
  }, []);

  const checkAttendanceForDate = async (date: Date) => {
    setCheckingAttendance(true);
    setAttendanceStatus('Checking');
    setCheckInTime('--:--');
    setCheckOutTime('--:--');

    try {
      const token = await getSecureToken();
      const userId = await AsyncStorage.getItem('user_id');
      if (!token || !userId) {
        setAttendanceStatus('Error');
        return;
      }

      const formatted = formatDate(date);

      const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_attendance', {
        method: 'POST',
        headers: {
          'Authorization': token.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          employee: userId.trim(),
          from_date: formatted,
          to_date: formatted
        })
      });

      const result = await response.json();
      console.log('Attendance check result for date', formatted, ':', result);

      if (response.ok) {
        const data = result.message?.data || (Array.isArray(result.message) ? result.message : []);

        const normalize = (timeStr: string | null | undefined) => {
          if (!timeStr) return null;
          return timeStr.replace('T', ' ').trim();
        };

        const cleanTime = (raw: string | null | undefined) => {
          const n = normalize(raw);
          if (!n || n === '--:--' || n === '-') return '--:--';
          if (n.includes('AM') || n.includes('PM')) return n;
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

        if (data && data.length > 0) {
          const record = data[0];
          console.log('Found attendance record:', record);

          let status = record.status;

          const getHours = (str: string | null) => {
            if (!str || str === '--:--') return 0;
            const parts = str.includes(':') ? str.split(':') : str.split(' ');
            let h = parseInt(parts[0]) || 0;
            let m = parseInt(parts[1]) || 0;
            return h + (m / 60);
          };

          const workHrs = getHours(record.total_working_hours);
          let derivedStatus = status;

          if (status === 'Present' || (record.in_time && record.in_time !== '--:--') || (record.out_time && record.out_time !== '--:--')) {
            if (workHrs > 0 && workHrs < 8.5) {
              derivedStatus = 'Half Day';
            } else {
              derivedStatus = 'Present';
            }
          }
          if (status === 'Half Day') {
            derivedStatus = 'Half Day';
          }

          setAttendanceStatus(derivedStatus);

          let inT = cleanTime(record.in_time);
          let outT = cleanTime(record.out_time);

          if (!inT || inT === '--:--' || !outT || outT === '--:--') {
            try {
              const checkinsResponse = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_checkins', {
                method: 'POST',
                headers: {
                  'Authorization': token.trim(),
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ employee: userId.trim() })
              });

              if (checkinsResponse.ok) {
                const checkinsData = await checkinsResponse.json();

                const extractLogs = (res: any): any[] => {
                  if (!res) return [];
                  if (Array.isArray(res)) return res;
                  if (Array.isArray(res.message)) return res.message;
                  if (res.message?.data && Array.isArray(res.message.data)) return res.message.data;
                  if (res.message?.logs && Array.isArray(res.message.logs)) return res.message.logs;
                  if (res.data && Array.isArray(res.data)) return res.data;
                  return [];
                };

                const rawLogs = extractLogs(checkinsData) || [];
                const entriesForDate: Date[] = [];

                rawLogs.forEach((l: any) => {
                  const timeVal = l.time || l.timestamp || l.log_time || l.created_at || l.date;
                  if (!timeVal) return;
                  const d = new Date(timeVal);
                  if (!isNaN(d.getTime())) {
                    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    if (dateKey === formatted) {
                      entriesForDate.push(d);
                    }
                  }
                });

                if (entriesForDate.length > 0) {
                  entriesForDate.sort((a, b) => a.getTime() - b.getTime());
                  const firstCheckIn = entriesForDate[0];
                  const lastCheckOut = entriesForDate[entriesForDate.length - 1];

                  if (inT === '--:--') {
                    inT = firstCheckIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  if (outT === '--:--' && entriesForDate.length > 1) {
                    outT = lastCheckOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                }
              }
            } catch (err) {
              console.warn('Failed to fetch fallback checkins:', err);
            }
          }

          setCheckInTime(inT || '--:--');
          setCheckOutTime(outT || '--:--');
        } else {
          try {
            const checkinsResponse = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_checkins', {
              method: 'POST',
              headers: {
                'Authorization': token.trim(),
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify({ employee: userId.trim() })
            });

            if (checkinsResponse.ok) {
              const checkinsData = await checkinsResponse.json();
              const extractLogs = (res: any): any[] => {
                if (!res) return [];
                if (Array.isArray(res)) return res;
                if (Array.isArray(res.message)) return res.message;
                if (res.message?.data && Array.isArray(res.message.data)) return res.message.data;
                if (res.message?.logs && Array.isArray(res.message.logs)) return res.message.logs;
                if (res.data && Array.isArray(res.data)) return res.data;
                return [];
              };

              const rawLogs = extractLogs(checkinsData) || [];
              const entriesForDate: Date[] = [];

              rawLogs.forEach((l: any) => {
                const timeVal = l.time || l.timestamp || l.log_time || l.created_at || l.date;
                if (!timeVal) return;
                const d = new Date(timeVal);
                if (!isNaN(d.getTime())) {
                  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  if (dateKey === formatted) {
                    entriesForDate.push(d);
                  }
                }
              });

              if (entriesForDate.length > 0) {
                entriesForDate.sort((a, b) => a.getTime() - b.getTime());
                const firstCheckIn = entriesForDate[0];
                const lastCheckOut = entriesForDate[entriesForDate.length - 1];
                const diffMins = (lastCheckOut.getTime() - firstCheckIn.getTime()) / (1000 * 60);
                const workHrs = diffMins / 60;

                let derivedStatus = 'Present';
                if (workHrs > 0 && workHrs < 8.5) {
                  derivedStatus = 'Half Day';
                }

                setAttendanceStatus(derivedStatus as any);
                setCheckInTime(firstCheckIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                setCheckOutTime(entriesForDate.length > 1 ? lastCheckOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--');
                setCheckingAttendance(false);
                return;
              }
            }
          } catch (err) {
            console.warn('Failed to fetch fallback checkins for no attendance record:', err);
          }

          setAttendanceStatus('Absent');
        }
      } else {
        setAttendanceStatus('Error');
      }
    } catch (e) {
      console.error('Error checking attendance:', e);
      setAttendanceStatus('Error');
    } finally {
      setCheckingAttendance(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await getSecureToken();
      const userId = await AsyncStorage.getItem('user_id');
      if (!token || !userId) return;

      const authHeader = token.trim();

      const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_gate_pass', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ employee: userId.trim() })
      });

      const result = await response.json();
      if (response.ok) {
        const message = result.message;
        const data = message?.data || (Array.isArray(message) ? message : []);
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch History Error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const C = {
    primary: '#4361EE',
    primaryLight: '#EEF2FF',
    danger: '#EF4444',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    gray50: isDarkMode ? '#334155' : '#F8F9FA',
    gray100: isDarkMode ? '#334155' : '#F1F3F5',
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseTimeToDate = (timeStr: string) => {
    const d = new Date();
    try {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      let hr = parseInt(hours, 10);
      let min = parseInt(minutes, 10);
      if (modifier === 'PM' && hr < 12) hr += 12;
      if (modifier === 'AM' && hr === 12) hr = 0;
      d.setHours(hr, min, 0, 0);
    } catch (e) {
      console.warn('Failed to parse time string:', timeStr);
    }
    return d;
  };

  const formatTimeToString = (date: Date) => {
    let hr = date.getHours();
    let min = date.getMinutes();
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    const hrStr = hr.toString().padStart(2, '0');
    const minStr = min.toString().padStart(2, '0');
    return `${hrStr}:${minStr} ${ampm}`;
  };

  const parseTimeStrToSeconds = (timeStr: string | null | undefined) => {
    if (!timeStr) return 0;
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      let hr = parseInt(hours, 10);
      let min = parseInt(minutes, 10);
      if (modifier === 'PM' && hr < 12) hr += 12;
      if (modifier === 'AM' && hr === 12) hr = 0;
      return hr * 3600 + min * 60;
    } else {
      const parts = timeStr.split(':');
      const hr = parseInt(parts[0], 10) || 0;
      const min = parseInt(parts[1], 10) || 0;
      const sec = parseInt(parts[2], 10) || 0;
      return hr * 3600 + min * 60 + sec;
    }
  };

  const getUsedGatePassStats = (date: Date) => {
    let count = 0;
    let totalSeconds = 0;

    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();

    history.forEach(item => {
      const status = (item.status || 'Pending').toLowerCase();
      if (status.includes('reject') || status.includes('cancel')) {
        return;
      }

      const itemDateStr = item.date || item.creation;
      if (!itemDateStr) return;

      const itemDate = new Date(itemDateStr);
      if (isNaN(itemDate.getTime())) return;

      if (itemDate.getFullYear() === targetYear && itemDate.getMonth() === targetMonth) {
        count++;

        const startSec = parseTimeStrToSeconds(item.gpass_from || item.out_time);
        const endSec = parseTimeStrToSeconds(item.gpass_in || item.in_time);
        if (endSec > startSec) {
          totalSeconds += (endSec - startSec);
        }
      }
    });

    return { count, totalSeconds };
  };

  const openPicker = (type: 'out' | 'in') => {
    setActivePicker(type);
    setPickerVisible(true);
  };

  const onFilterDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowFilterPicker(false);
    if (selectedDate) {
      if (filterPickerType === 'start') setFilterStart(selectedDate);
      else setFilterEnd(selectedDate);
    }
  };

  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date || a.creation).getTime();
    const dateB = new Date(b.date || b.creation).getTime();
    return dateB - dateA;
  });

  const filteredHistory = sortedHistory.filter(item => {
    if (!filterStart && !filterEnd) return true;
    const itemDate = new Date(item.date || item.creation);
    if (filterStart && itemDate < new Date(filterStart.setHours(0, 0, 0, 0))) return false;
    if (filterEnd && itemDate > new Date(filterEnd.setHours(23, 59, 59, 999))) return false;
    return true;
  });

  const displayHistory = (!filterStart && !filterEnd) ? filteredHistory.slice(0, 5) : filteredHistory;
  const convertTo24h = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date for the gate pass.');
      return;
    }

    if (attendanceStatus !== 'Half Day') {
      Alert.alert('Error', "Gate Pass can't be applied on this date.");
      return;
    }

    const stats = getUsedGatePassStats(selectedDate);
    if (maxGatePasses > 0 && stats.count >= maxGatePasses) {
      Alert.alert('Error', `You have reached the maximum allowed gate passes (${maxGatePasses}) for this month.`);
      return;
    }

    const currentDuration = parseTimeStrToSeconds(inTime) - parseTimeStrToSeconds(outTime);
    const totalSecWithCurrent = stats.totalSeconds + (currentDuration > 0 ? currentDuration : 0);
    if (maxGatePassSeconds > 0 && totalSecWithCurrent > maxGatePassSeconds) {
      const formatSecToHoursMins = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
      };
      Alert.alert('Error', `This request exceeds the allowed monthly duration limit of ${formatSecToHoursMins(maxGatePassSeconds)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getSecureToken();
      const userId = await AsyncStorage.getItem('user_id');

      if (!token || !userId) {
        Alert.alert('Error', 'Authentication failed. Please login again.');
        router.replace('/');
        return;
      }

      const dateStr = formatDate(selectedDate);

      const payload = {
        employee: userId.trim(),
        reason: 'Gate Pass',
        date: dateStr,
        gpass_from: convertTo24h(outTime),
        gpass_in: convertTo24h(inTime),
      };

      console.log('📡 Submitting Gate Pass:', payload);

      const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.create_gate_pass', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.trim(),
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('📥 Gate Pass Response:', result);

      if (response.ok) {
        Alert.alert('Success', 'Gate Pass request submitted successfully!');
        setReason('');
        fetchHistory();
      } else {
        Alert.alert('Error', result.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Gate Pass Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      {/* Stabilized Header */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <IconSymbol name="arrow.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Gate Pass Request</Text>
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
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#E3F2FD' }]}>
              <IconSymbol name="door.right.hand.open" size={16} color="#2196F3" />
            </View>
            <Text style={[styles.sectionLabel, { color: C.text }]}>Exit Information</Text>
          </View>

          {/* Employee ID */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Employee ID</Text>
            <View style={[styles.readOnlyContainer, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
              <Text style={[styles.readOnlyText, { color: C.subText }]}>{employeeId || 'Loading...'}</Text>
            </View>
          </View>

          {/* Employee Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Employee Name</Text>
            <View style={[styles.readOnlyContainer, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
              <Text style={[styles.readOnlyText, { color: C.subText }]}>{employeeName || 'Loading...'}</Text>
            </View>
          </View>

          {/* Approver */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Approver</Text>
            <View style={[styles.readOnlyContainer, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
              <Text style={[styles.readOnlyText, { color: C.subText }]}>{approver || 'Loading...'}</Text>
            </View>
          </View>

          {/* Date Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Select Gate Pass Date</Text>
            <TouchableOpacity
              style={[styles.readOnlyContainer, { backgroundColor: C.gray50, borderColor: C.gray100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.readOnlyText, { color: selectedDate ? C.text : C.subText }]}>
                {selectedDate ? selectedDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : 'Choose Date'}
              </Text>
              <IconSymbol name="calendar" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>

          {/* Eligibility Check Status Messages */}
          {checkingAttendance && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 15 }}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={{ color: C.subText, fontSize: 14 }}>Checking attendance status...</Text>
            </View>
          )}

          {!checkingAttendance && attendanceStatus === 'Absent' && (
            <View style={[styles.statusBanner, { backgroundColor: '#FFD2D2', borderColor: '#F44336' }]}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#F44336" />
              <Text style={[styles.statusBannerText, { color: '#B71C1C' }]}>
                Gate Pass can't be applied on this date as you were Absent.
              </Text>
            </View>
          )}

          {!checkingAttendance && attendanceStatus === 'Present' && (
            <View style={[styles.statusBanner, { backgroundColor: '#FFD2D2', borderColor: '#F44336' }]}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#F44336" />
              <Text style={[styles.statusBannerText, { color: '#B71C1C' }]}>
                Gate Pass can't be applied on this date as you were Present.
              </Text>
            </View>
          )}

          {!checkingAttendance && attendanceStatus === 'Half Day' && (() => {
            const stats = selectedDate ? getUsedGatePassStats(selectedDate) : { count: 0, totalSeconds: 0 };
            const limitPassed = maxGatePasses > 0 && stats.count >= maxGatePasses;

            const currentDuration = parseTimeStrToSeconds(inTime) - parseTimeStrToSeconds(outTime);
            const totalSecWithCurrent = stats.totalSeconds + (currentDuration > 0 ? currentDuration : 0);
            const hoursLimitPassed = maxGatePassSeconds > 0 && totalSecWithCurrent > maxGatePassSeconds;

            const formatSecToHoursMins = (secs: number) => {
              const h = Math.floor(secs / 3600);
              const m = Math.floor((secs % 3600) / 60);
              if (h > 0) return `${h}h ${m}m`;
              return `${m}m`;
            };

            return (
              <>
                <View style={[styles.statusBanner, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
                  <Text style={[styles.statusBannerText, { color: '#2E7D32' }]}>
                    Verification passed: You had a Half Day on this date.
                  </Text>
                </View>

                {/* Usage statistics display */}
                <View style={[styles.statsBox, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 10 }}>Monthly Gate Pass Usage</Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: C.subText }}>Limit per Month:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>
                      {maxGatePasses > 0 ? `${maxGatePasses} requests` : 'No limit'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: C.subText }}>Used in {selectedDate?.toLocaleDateString([], { month: 'long', year: 'numeric' })}:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: limitPassed ? C.danger : C.text }}>
                      {stats.count} request(s)
                    </Text>
                  </View>

                  <View style={{ height: 1, backgroundColor: C.gray100, marginVertical: 8 }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: C.subText }}>Allowed Duration:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>
                      {maxGatePassSeconds > 0 ? formatSecToHoursMins(maxGatePassSeconds) : 'No limit'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: C.subText }}>Used Duration:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>
                      {formatSecToHoursMins(stats.totalSeconds)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: C.subText }}>Current Request Duration:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>
                      {currentDuration > 0 ? formatSecToHoursMins(currentDuration) : '0m'}
                    </Text>
                  </View>
                </View>

                {limitPassed && (
                  <View style={[styles.statusBanner, { backgroundColor: '#FFD2D2', borderColor: '#F44336', marginVertical: 10 }]}>
                    <IconSymbol name="xmark.circle.fill" size={20} color="#F44336" />
                    <Text style={[styles.statusBannerText, { color: '#B71C1C' }]}>
                      You have already reached the maximum allowed gate passes ({maxGatePasses}) for this month.
                    </Text>
                  </View>
                )}

                {!limitPassed && hoursLimitPassed && (
                  <View style={[styles.statusBanner, { backgroundColor: '#FFD2D2', borderColor: '#F44336', marginVertical: 10 }]}>
                    <IconSymbol name="xmark.circle.fill" size={20} color="#F44336" />
                    <Text style={[styles.statusBannerText, { color: '#B71C1C' }]}>
                      This request exceeds the allowed monthly duration limit of {formatSecToHoursMins(maxGatePassSeconds)}.
                    </Text>
                  </View>
                )}

                {/* Actual Check-In and Check-Out (Read-Only) */}
                <View style={styles.dateRow}>
                  <View style={[styles.dateInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
                    <Text style={styles.inputLabelSmall}>Actual Check-In</Text>
                    <View style={styles.dateValueRow}>
                      <Text style={[styles.dateText, { color: C.subText }]}>{checkInTime}</Text>
                      <IconSymbol name="arrow.down.left.circle.fill" size={16} color={C.primary} />
                    </View>
                  </View>

                  <View style={[styles.dateInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
                    <Text style={styles.inputLabelSmall}>Actual Check-Out</Text>
                    <View style={styles.dateValueRow}>
                      <Text style={[styles.dateText, { color: C.subText }]}>{checkOutTime}</Text>
                      <IconSymbol name="arrow.up.right.circle.fill" size={16} color={C.danger} />
                    </View>
                  </View>
                </View>

                {/* Gate Pass Out Time and In Time */}
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={[styles.dateInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}
                    onPress={() => openPicker('out')}
                  >
                    <Text style={styles.inputLabelSmall}>From Time</Text>
                    <View style={styles.dateValueRow}>
                      <Text style={[styles.dateText, { color: C.text }]}>{outTime}</Text>
                      <IconSymbol name="clock.fill" size={16} color={C.primary} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dateInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}
                    onPress={() => openPicker('in')}
                  >
                    <Text style={styles.inputLabelSmall}>To Time</Text>
                    <View style={styles.dateValueRow}>
                      <Text style={[styles.dateText, { color: C.text }]}>{inTime}</Text>
                      <IconSymbol name="clock.fill" size={16} color={C.primary} />
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          <View style={styles.divider} />

          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#E8F5E9' }]}>
              <IconSymbol name="clock.arrow.circlepath" size={16} color="#4CAF50" />
            </View>
            <Text style={[styles.sectionLabel, { color: C.text }]}>History</Text>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}
              onPress={() => {
                setFilterPickerType('start');
                setShowFilterPicker(true);
              }}
            >
              <Text style={styles.filterLabel}>From Date</Text>
              <Text style={[styles.filterValue, { color: C.text }]}>{filterStart ? filterStart.toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'All'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}
              onPress={() => {
                setFilterPickerType('end');
                setShowFilterPicker(true);
              }}
            >
              <Text style={styles.filterLabel}>To Date</Text>
              <Text style={[styles.filterValue, { color: C.text }]}>{filterEnd ? filterEnd.toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'All'}</Text>
            </TouchableOpacity>

            {(filterStart || filterEnd) && (
              <TouchableOpacity onPress={() => { setFilterStart(null); setFilterEnd(null); }} style={styles.clearBtn}>
                <IconSymbol name="xmark.circle.fill" size={20} color={C.danger} />
              </TouchableOpacity>
            )}
          </View>

          {showFilterPicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date())}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onFilterDateChange}
              maximumDate={new Date(2030, 11, 31)}
              minimumDate={new Date(2020, 0, 1)}
            />
          )}

          {showFilterPicker && Platform.OS === 'web' && (
            <Modal transparent visible={showFilterPicker} animationType="fade">
              <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFilterPicker(false)} />
                <View style={[styles.pickerContainer, {
                  backgroundColor: C.card,
                  width: 360,
                  alignSelf: 'center',
                  padding: 24,
                  paddingBottom: 32,
                  borderRadius: 28,
                  elevation: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 25,
                  position: 'relative'
                }]}>
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ backgroundColor: C.primary + '15', padding: 12, borderRadius: 16, marginBottom: 12 }}>
                      <IconSymbol name="calendar" size={24} color={C.primary} />
                    </View>
                    <Text style={[styles.pickerTitle, { color: C.text, fontSize: 18, fontWeight: '800' }]}>
                      Select {filterPickerType === 'start' ? 'Start' : 'End'} Date
                    </Text>
                    <Text style={{ color: C.subText, fontSize: 12, marginTop: 4 }}>Pick a date to filter your history</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    <select
                      style={{
                        flex: 2,
                        padding: '16px',
                        borderRadius: '16px',
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date())).getDate()}
                      onChange={(e) => {
                        const current = filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date());
                        onFilterDateChange({} as any, new Date(current.getFullYear(), current.getMonth(), parseInt(e.target.value)));
                      }}
                    >
                      {[...Array(31)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                    </select>

                    <select
                      style={{
                        flex: 3,
                        padding: '16px',
                        borderRadius: '16px',
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date())).getMonth()}
                      onChange={(e) => {
                        const current = filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date());
                        onFilterDateChange({} as any, new Date(current.getFullYear(), parseInt(e.target.value), current.getDate()));
                      }}
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>

                    <select
                      style={{
                        flex: 3,
                        padding: '16px',
                        borderRadius: '16px',
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date())).getFullYear()}
                      onChange={(e) => {
                        const current = filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date());
                        onFilterDateChange({} as any, new Date(parseInt(e.target.value), current.getMonth(), current.getDate()));
                      }}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </View>

                  <TouchableOpacity
                    style={[styles.applyBtn, { marginTop: 12, height: 56, borderRadius: 16 }]}
                    onPress={() => setShowFilterPicker(false)}
                  >
                    <Text style={[styles.applyBtnText, { fontSize: 16 }]}>Confirm Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setSelectedDate(date);
                  checkAttendanceForDate(date);
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(2020, 0, 1)}
            />
          )}

          {showDatePicker && Platform.OS === 'web' && (
            <Modal transparent visible={showDatePicker} animationType="fade">
              <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(false)} />
                <View style={[styles.pickerContainer, {
                  backgroundColor: C.card,
                  width: 360,
                  alignSelf: 'center',
                  padding: 24,
                  paddingBottom: 32,
                  borderRadius: 28,
                  elevation: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 25,
                  position: 'relative'
                }]}>
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ backgroundColor: C.primary + '15', padding: 12, borderRadius: 16, marginBottom: 12 }}>
                      <IconSymbol name="calendar" size={24} color={C.primary} />
                    </View>
                    <Text style={[styles.pickerTitle, { color: C.text, fontSize: 18, fontWeight: '800' }]}>
                      Select Gate Pass Date
                    </Text>
                    <Text style={{ color: C.subText, fontSize: 12, marginTop: 4 }}>Pick the date you want to apply for</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    <select
                      style={{
                        flex: 2,
                        padding: '16px',
                        borderRadius: '16px',
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(selectedDate || new Date()).getDate()}
                      onChange={(e) => {
                        const current = selectedDate || new Date();
                        const newD = new Date(current.getFullYear(), current.getMonth(), parseInt(e.target.value));
                        setSelectedDate(newD);
                        checkAttendanceForDate(newD);
                      }}
                    >
                      {[...Array(31)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                    </select>

                    <select
                      style={{
                        flex: 3,
                        padding: '16px',
                        borderRadius: '16px',
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(selectedDate || new Date()).getMonth()}
                      onChange={(e) => {
                        const current = selectedDate || new Date();
                        const newD = new Date(current.getFullYear(), parseInt(e.target.value), current.getDate());
                        setSelectedDate(newD);
                        checkAttendanceForDate(newD);
                      }}
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>

                    <select
                      style={{
                        flex: 3,
                        padding: '16px',
                        borderRadius: '16px',
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(selectedDate || new Date()).getFullYear()}
                      onChange={(e) => {
                        const current = selectedDate || new Date();
                        const newD = new Date(parseInt(e.target.value), current.getMonth(), current.getDate());
                        setSelectedDate(newD);
                        checkAttendanceForDate(newD);
                      }}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </View>

                  <TouchableOpacity
                    style={[styles.applyBtn, { marginTop: 12, height: 56, borderRadius: 16 }]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={[styles.applyBtnText, { fontSize: 16 }]}>Confirm Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
          {loadingHistory ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 10 }} />
          ) : displayHistory.length > 0 ? (
            displayHistory.map((item, idx) => (
              <View key={idx} style={[styles.historyItem, { backgroundColor: C.gray50, borderColor: C.gray100, marginBottom: 12 }]}>
                <View style={[styles.historyLeft, { flex: 1 }]}>
                  <View style={[styles.historyIconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                    <IconSymbol name="door.right.hand.open" size={18} color={C.primary} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.historyTitle, { color: C.text }]} numberOfLines={1}>{item.reason}</Text>
                    <Text style={[styles.historySub, { color: C.subText }]}>
                      {item.date ? new Date(item.date).toLocaleDateString([], { day: '2-digit', month: 'short' }) : (item.creation ? new Date(item.creation).toLocaleDateString([], { day: '2-digit', month: 'short' }) : '')} · {(item.gpass_from || item.out_time)?.substring(0, 5)} - {(item.gpass_in || item.in_time)?.substring(0, 5)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'Approved' ? '#E8F5E9' : '#FFF3E0', minWidth: 70 }]}>
                  <Text style={[styles.statusText, { color: item.status === 'Approved' ? '#4CAF50' : '#FF9800' }]}>{item.status || 'Pending'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: C.subText, textAlign: 'center', marginTop: 10, fontSize: 12 }}>No recent requests</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: C.card, borderTopColor: C.gray100 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Discard</Text>
        </TouchableOpacity>
        {attendanceStatus === 'Half Day' && (() => {
          const stats = selectedDate ? getUsedGatePassStats(selectedDate) : { count: 0, totalSeconds: 0 };
          const limitPassed = maxGatePasses > 0 && stats.count >= maxGatePasses;

          const currentDuration = parseTimeStrToSeconds(inTime) - parseTimeStrToSeconds(outTime);
          const totalSecWithCurrent = stats.totalSeconds + (currentDuration > 0 ? currentDuration : 0);
          const hoursLimitPassed = maxGatePassSeconds > 0 && totalSecWithCurrent > maxGatePassSeconds;

          if (limitPassed || hoursLimitPassed) return null;

          return (
            <TouchableOpacity
              style={[styles.applyBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.applyBtnText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          );
        })()}
      </View>

      {pickerVisible && Platform.OS !== 'web' && (
        <DateTimePicker
          value={parseTimeToDate(activePicker === 'out' ? outTime : inTime)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setPickerVisible(false);
            if (date) {
              const formatted = formatTimeToString(date);
              if (activePicker === 'out') setOutTime(formatted);
              else setInTime(formatted);
            }
          }}
        />
      )}

      {pickerVisible && Platform.OS === 'web' && (
        <Modal transparent visible={pickerVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
            <View style={[styles.pickerContainer, {
              backgroundColor: C.card,
              width: 300,
              alignSelf: 'center',
              padding: 24,
              borderRadius: 20,
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 25,
              position: 'relative'
            }]}>
              <Text style={[styles.pickerTitle, { color: C.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 15 }]}>
                Select {activePicker === 'out' ? 'From' : 'To'} Time
              </Text>
              <input
                type="time"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${C.gray100}`,
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: C.gray50,
                  color: C.text
                }}
                value={(() => {
                  const timeStr = activePicker === 'out' ? outTime : inTime;
                  const [time, modifier] = timeStr.split(' ');
                  let [h, m] = time.split(':');
                  let hr = parseInt(h);
                  if (modifier === 'PM' && hr < 12) hr += 12;
                  if (modifier === 'AM' && hr === 12) hr = 0;
                  return `${hr.toString().padStart(2, '0')}:${m}`;
                })()}
                onChange={(e) => {
                  const val = e.target.value; // e.g. "13:30"
                  if (val) {
                    const [h, m] = val.split(':');
                    const hr = parseInt(h);
                    const ampm = hr >= 12 ? 'PM' : 'AM';
                    const h12 = hr % 12 || 12;
                    const formatted = `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
                    if (activePicker === 'out') setOutTime(formatted);
                    else setInTime(formatted);
                  }
                }}
              />
              <TouchableOpacity
                style={[styles.applyBtn, { marginTop: 15, height: 44, borderRadius: 12 }]}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={styles.applyBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  card: { marginHorizontal: 20, borderRadius: 24, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
  statsBox: { borderRadius: 16, padding: 15, borderWidth: 1, marginBottom: 15, borderStyle: 'dashed' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '700' },
  inputGroup: { marginBottom: 20 },
  readOnlyContainer: { borderRadius: 16, padding: 15, borderWidth: 1, justifyContent: 'center' },
  readOnlyText: { fontSize: 14, fontWeight: '700' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, borderRadius: 16, borderWidth: 1, marginVertical: 15 },
  statusBannerText: { fontSize: 13, fontWeight: '700', flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  textAreaContainer: { borderRadius: 16, padding: 15, borderWidth: 1, minHeight: 100 },
  textArea: { fontSize: 14, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateInput: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1 },
  inputLabelSmall: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  dateValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 15, flexWrap: 'wrap' },
  filterInput: { minWidth: 100, flex: 1, borderRadius: 12, padding: 8, borderWidth: 1 },
  filterLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  filterValue: { fontSize: 13, fontWeight: '700' },
  clearBtn: { padding: 5 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginHorizontal: 2 },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  historyTitle: { fontSize: 14, fontWeight: '700' },
  historySub: { fontSize: 11, marginTop: 2 },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#2E7D32', fontSize: 10, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 25, gap: 12, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F3F5' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  applyBtn: { flex: 2, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B1B2F' },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerContainer: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, maxHeight: '60%' },
  pickerIndicator: { width: 40, height: 5, backgroundColor: '#CBD5E1', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  pickerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 16, fontWeight: '600' },
});
