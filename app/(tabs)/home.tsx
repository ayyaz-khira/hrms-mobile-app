import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { isDarkMode } = useTheme();

  const C = {
    primary: '#4361EE',
    dark: isDarkMode ? '#050505' : '#1B1B2F',
    white: isDarkMode ? '#161B22' : '#FFFFFF',
    gray50: isDarkMode ? '#1F2937' : '#F8F9FA',
    gray100: isDarkMode ? '#161B22' : '#F1F3F5',
    gray200: isDarkMode ? '#1F2937' : '#E9ECEF',
    gray400: isDarkMode ? '#4B5563' : '#CED4DA',
    gray600: isDarkMode ? '#94A3B8' : '#868E96',
    gray900: isDarkMode ? '#F8F9FB' : '#212529',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    bg: isDarkMode ? '#0B0E14' : '#F8F9FB',
  };

  const [userName, setUserName] = useState('');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState({
    presentDays: 22,
    leaveBalance: 8,
    checkIn: '--:--',
    checkOut: '--:--',
    workedHours: '00:00:00'
  });
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [lastCheckInRaw, setLastCheckInRaw] = useState<Date | null>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeader = async (): Promise<string | null> => {
    const rawToken = await AsyncStorage.getItem('user_token');
    if (!rawToken) return null;

    const token = rawToken.trim();
    return token.replace(/^(bearer|token)\s+/i, '');
  };

  // ====================== LOAD DASHBOARD ======================
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      
      // Heartbeat to keep session alive (every 1 minute)
      const heartbeat = setInterval(async () => {
        const authHeader = await getAuthHeader();
        const userId = await AsyncStorage.getItem('user_id');
        if (authHeader && userId) {
          fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_details', {
        credentials: 'include',
            method: 'POST',
            headers: { 
              'Authorization': authHeader, 
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest' 
            },
            body: JSON.stringify({ employee: userId.trim() })
          }).catch(() => {});
        }
      }, 60000);

      return () => clearInterval(heartbeat);
    }, [])
  );

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const savedName = await AsyncStorage.getItem('user_name');
      if (savedName) setUserName(savedName);

      const userId = await AsyncStorage.getItem('user_id');
      const authHeader = await getAuthHeader();

      if (!authHeader || !userId) {
        console.error("❌ Missing token or userId");
        return;
      }

      const commonHeaders: any = {
        Authorization: authHeader,
        sid: !authHeader.toLowerCase().includes("token") ? authHeader : undefined,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      // Fetch Attendance Summary for current month stats
      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
      
      const attendResponse = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_attendance', {
        credentials: 'include',
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ employee: userId.trim(), from_date: firstDay, to_date: lastDay })
      });

      let presentCount = 0;
      if (attendResponse.ok) {
        const attendResult = await attendResponse.json();
        const attendData = attendResult.message?.data || [];
        setAllAttendance(attendData);
        const presentDates = new Set();
        attendData.forEach((l: any) => {
          if (l.status === 'Present' || l.status === 'Half Day' || (l.in_time && l.in_time !== '--:--')) {
            presentDates.add(l.attendance_date);
          }
        });
        presentCount = presentDates.size;
      }

      const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_checkins', {
        credentials: 'include',
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ employee: userId.trim() })
      });

      if (response.status === 417 || response.status === 401) {
        console.warn("⚠️ Session expired (417/401). Redirecting to login...");
        await AsyncStorage.multiRemove(['user_token', 'user_id', 'employee_details']);
        router.replace('/');
        return;
      }

      if (!response.ok) return;

      const result = await response.json();
      
      const extractLogs = (res: any): any[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.message)) return res.message;
        if (res.message?.data && Array.isArray(res.message.data)) return res.message.data;
        if (res.message?.logs && Array.isArray(res.message.logs)) return res.message.logs;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      };

      const logs = extractLogs(result);

      if (logs.length > 0) {
        const map = new Map();
        logs.forEach((l: any) => {
          if (!l.time) return;
          const d = new Date(l.time);
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          if (!map.has(dateKey)) {
            map.set(dateKey, { 
              dateKey, 
              date: d.toLocaleDateString([], { day: '2-digit', month: 'short' }), 
              in: null, 
              out: null, 
              inRaw: null, 
              outRaw: null 
            });
          }

          const entry = map.get(dateKey);
          const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const type = (l.log_type || '').toString().toUpperCase();

          if (type === 'IN' || !entry.inRaw || d < entry.inRaw) {
            if (entry.inRaw && d < entry.inRaw && !entry.outRaw) {
              entry.out = entry.in;
              entry.outRaw = entry.inRaw;
            }
            entry.in = timeStr;
            entry.inRaw = d;
          }

          if (type === 'OUT' || !entry.outRaw || d > entry.outRaw) {
            if (d > entry.inRaw) {
              entry.out = timeStr;
              entry.outRaw = d;
            }
          }
        });

        const grouped = Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

        setRecentHistory(grouped.slice(0, 3));
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayEntry = grouped.find(g => g.dateKey === today);

        if (todayEntry) {
          setDashboardData(prev => ({ ...prev, checkIn: todayEntry.in || '--:--', checkOut: todayEntry.out || '--:--', presentDays: presentCount }));
          const isIn = !!todayEntry.in && !todayEntry.out;
          setIsCheckedIn(isIn);
          setLastCheckInRaw(isIn && todayEntry.inRaw ? todayEntry.inRaw : null);
        } else {
          setIsCheckedIn(false);
          setLastCheckInRaw(null);
          setDashboardData(prev => ({ ...prev, checkIn: '--:--', checkOut: '--:--', workedHours: '00:00:00', presentDays: presentCount }));
        }
      }

      // Employee Details
      const detailsRes = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_details', {
        credentials: 'include',
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ employee: userId.trim() })
      });
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        if (detailsData.message?.employee_name) setUserName(detailsData.message.employee_name);
      }
    } catch (e) {
      console.error("❌ Dashboard Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  // Timer Effect
  React.useEffect(() => {
    let interval: any;
    if (isCheckedIn && lastCheckInRaw) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.max(0, now.getTime() - lastCheckInRaw.getTime());
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setDashboardData(prev => ({ ...prev, workedHours: timeStr }));
      }, 1000);
    } else {
      setDashboardData(prev => ({ ...prev, workedHours: '00:00:00' }));
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, lastCheckInRaw]);

  const handlePunch = async () => {
    setIsPunching(true);
    try {
      const authHeader = await getAuthHeader();
      const userId = await AsyncStorage.getItem('user_id');

      if (!authHeader || !userId) {
        Alert.alert('Error', 'Authentication failed. Please login again.');
        return;
      }

      const punchType = isCheckedIn ? 'OUT' : 'IN';

      const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.employee_checkin', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employee: userId.trim(),
          log_type: punchType,
          timestamp: new Date().toISOString(),
          location: 'Mobile Dashboard'
        })
      });

      if (response.ok) {
        setIsCheckedIn(!isCheckedIn);
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setDashboardData(prev => ({
          ...prev,
          presentDays: presentCount,
          checkIn: earliest ? earliest.time : '--:--',
          checkOut: latest ? latest.time : '--:--',
          workedHours: workedStr
        }));
        Alert.alert('Success', `Successfully punched ${punchType.toLowerCase()} at ${now}`);
        setTimeout(loadDashboardData, 1000);
      } else {
        const res = await response.json().catch(() => ({}));
        Alert.alert('Error', res.message || 'Failed to record attendance');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setIsPunching(false);
    }
  };

  const getLogForDay = (day: number) => {
    const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allAttendance.find(l => l.attendance_date === dateStr);
  };

  const cleanTime = (raw: string | null | undefined) => {
    if (!raw || raw === '--:--' || raw === '-') return '-';
    // If it's "2026-05-13 09:00:00", extract "09:00"
    if (raw.includes(' ')) {
      const timePart = raw.split(' ')[1];
      return timePart.substring(0, 5);
    }
    return raw.substring(0, 5);
  };

  const calculateHours = (inT: string | null | undefined, outT: string | null | undefined) => {
    if (!inT || !outT || inT === '-' || outT === '-') return '-';
    
    const parseTime = (timeStr: string) => {
       // Expecting "HH:mm"
       let [h, m] = timeStr.split(':').map(Number);
       return { h, m };
    };

    try {
       const start = parseTime(inT);
       const end = parseTime(outT);
       
       let diffMins = (end.h * 60 + end.m) - (start.h * 60 + start.m);
       if (diffMins < 0) return '-';

       const hrs = Math.floor(diffMins / 60);
       const mins = diffMins % 60;
       return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
    } catch (e) {
       return '-';
    }
  };

  const getDayDetails = (day: number) => {
    const log = getLogForDay(day);
    if (log) {
       const inTime = cleanTime(log.in_time);
       const outTime = cleanTime(log.out_time);
       const workingHours = log.total_working_hours && log.total_working_hours !== '--:--' && log.total_working_hours !== '-'
          ? log.total_working_hours 
          : calculateHours(inTime, outTime);

       return { 
          checkIn: inTime, 
          checkOut: outTime, 
          workingHours: workingHours, 
          shift: log.shift || 'G Shift',
          status: log.status
       };
    }
    return { checkIn: '-', checkOut: '-', workingHours: '-', shift: '-', status: 'Absent' };
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 15,
      marginTop: Platform.OS === 'android' ? 10 : 0,
    },
    greetingText: { fontSize: 14, color: C.gray600, fontWeight: '500' },
    userName: { fontSize: 20, fontWeight: '800', color: C.gray900 },
    profileBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3F51B5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileBadgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    container: { flex: 1, paddingHorizontal: 20 },
    dashboardHeader: { marginBottom: 10 },
    dashboardTitle: { fontSize: 15, fontWeight: '800', color: C.gray900 },
    dashboardCard: {
      backgroundColor: C.white,
      borderRadius: 20,
      padding: 16,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: C.gray100,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    timerContainer: { alignItems: 'center', marginBottom: 15, width: '100%' },
    timerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 },
    timerLabel: { fontSize: 11, color: C.gray600, fontWeight: '700', letterSpacing: 0.3 },
    historyBtnText: { fontSize: 11, color: C.primary, fontWeight: '700' },
    clockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' },
    digitGroup: { alignItems: 'center', gap: 4 },
    digitPair: { flexDirection: 'row', gap: 4 },
    digitBox: {
      width: 28,
      height: 40,
      backgroundColor: isDarkMode ? '#334155' : '#F8F9FA',
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? 'transparent' : '#E9ECEF',
    },
    digitText: { fontSize: 20, fontWeight: '800', color: C.primary },
    digitSub: { fontSize: 7, fontWeight: '800', color: C.gray400, letterSpacing: 0.5 },
    colon: { fontSize: 18, fontWeight: '800', color: C.primary, marginTop: -15, paddingHorizontal: 2 },
    dashboardDivider: { height: 1, backgroundColor: C.gray100, marginHorizontal: -16, marginBottom: 12 },
    checkInOutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 0, width: '100%' },
    statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statCard: {
      flex: 1,
      backgroundColor: C.white,
      borderRadius: 20,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    statIconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 18, fontWeight: '800', color: C.gray900 },
    statLabel: { fontSize: 11, color: C.gray600, fontWeight: '500' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: C.gray900, marginBottom: 15 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8, marginBottom: 25 },
    actionItem: { alignItems: 'center', width: '23%', marginBottom: 15 },
    actionIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    actionLabel: { fontSize: 9, fontWeight: '700', color: C.gray900, textAlign: 'center' },
    announcementList: {
      backgroundColor: C.white,
      borderRadius: 20,
      padding: 15,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    announcementItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 15 },
    announcementDot: { width: 8, height: 8, borderRadius: 4 },
    announcementTitle: { fontSize: 14, fontWeight: '700', color: C.gray900, marginBottom: 2 },
    announcementTime: { fontSize: 11, color: C.gray600 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    calendarContainer: { width: '90%', backgroundColor: C.white, borderRadius: 24, padding: 20, elevation: 10 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    calendarTitle: { fontSize: 18, fontWeight: '800', color: C.gray900 },
    closeBtn: { padding: 4 },
    weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    weekDayText: { fontSize: 12, fontWeight: '700', color: C.gray400, width: '14.28%', textAlign: 'center' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
    dayBox: { width: '14.28%', alignItems: 'center', justifyContent: 'center' },
    dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    dayText: { fontSize: 13, fontWeight: '700', color: C.gray900 },
    presentBox: { backgroundColor: C.success },
    absentBox: { backgroundColor: '#F44336' },
    leaveBox: { backgroundColor: '#FF9800' },
    whiteText: { color: '#FFFFFF' },
    calendarLegend: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 25, paddingTop: 15, borderTopWidth: 1, borderTopColor: C.gray100 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    selectedDayCircle: { backgroundColor: C.primary, borderWidth: 2, borderColor: C.white, elevation: 3 },
    dayDetailsContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.gray100 },
    dayDetailsTitle: { fontSize: 15, fontWeight: '800', color: C.gray900, marginBottom: 15 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    detailItem: { width: '47%', backgroundColor: C.gray50, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
    detailLabel: { fontSize: 9, color: C.gray600, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '800', color: C.gray900 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 15 },
    viewAllText: { fontSize: 12, color: C.primary, fontWeight: '600' },
    attendanceCard: { backgroundColor: C.white, borderRadius: 20, padding: 15, elevation: 3 },
    attendanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    attendanceDateContainer: { width: 60 },
    attendanceDate: { fontSize: 14, fontWeight: '800', color: C.gray900 },
    attendanceTimeContainer: { flex: 1, flexDirection: 'row', gap: 20 },
    timeItem: { gap: 2 },
    timeLabel: { fontSize: 10, color: C.gray600, fontWeight: '600', textTransform: 'uppercase' },
    timeValue: { fontSize: 13, fontWeight: '700', color: C.gray900 },
    statusBadgeSmall: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, minWidth: 70, alignItems: 'center' },
    statusTextSmall: { fontSize: 10, fontWeight: '800' },
    divider: { height: 1, backgroundColor: C.gray100, marginHorizontal: 0 },
  });

  const AttendanceRow = ({ date, checkIn, checkOut, status, color }: any) => (
    <View style={styles.attendanceRow}>
      <View style={styles.attendanceDateContainer}>
        <Text style={styles.attendanceDate}>{date}</Text>
      </View>
      <View style={styles.attendanceTimeContainer}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Check-in</Text>
          <Text style={styles.timeValue}>{checkIn}</Text>
        </View>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Check-out</Text>
          <Text style={styles.timeValue}>{checkOut}</Text>
        </View>
      </View>
      <View style={[styles.statusBadgeSmall, { backgroundColor: color + '15' }]}>
        <Text style={[styles.statusTextSmall, { color: color }]}>{status}</Text>
      </View>
    </View>
  );

  const ActionItem = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={[styles.actionIconBg, { backgroundColor: C.white, borderColor: C.gray100, borderWidth: 1 }]}>
        <IconSymbol name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: C.gray900 }]}>{label}</Text>
    </TouchableOpacity>
  );

  const AnnouncementItem = ({ title, time, dotColor }: any) => (
    <View style={styles.announcementItem}>
      <View style={[styles.announcementDot, { backgroundColor: dotColor }]} />
      <View>
        <Text style={styles.announcementTitle}>{title}</Text>
        <Text style={styles.announcementTime}>{time}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greetingText}>Good morning</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.profileBadge} onPress={() => router.push("/profile")}>
            <Text style={styles.profileBadgeText}>{userName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
          </View>

          {/* Main Dashboard Card */}
          <View style={styles.dashboardCard}>
            <View style={styles.timerContainer}>
              <View style={styles.timerHeader}>
                <Text style={styles.timerLabel}>Total Worked Hours</Text>
                <TouchableOpacity onPress={() => router.push('/check-in')}>
                  <Text style={styles.historyBtnText}>History</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.clockRow}>
                <View style={styles.digitGroup}>
                  <View style={styles.digitPair}>
                    <View style={styles.digitBox}><Text style={styles.digitText}>{(dashboardData.workedHours.split(':')[0] || '00')[0] || '0'}</Text></View>
                    <View style={styles.digitBox}><Text style={styles.digitText}>{(dashboardData.workedHours.split(':')[0] || '00')[1] || '0'}</Text></View>
                  </View>
                  <Text style={styles.digitSub}>HOURS</Text>
                </View>

                <Text style={styles.colon}>:</Text>

                <View style={styles.digitGroup}>
                  <View style={styles.digitPair}>
                    <View style={styles.digitBox}><Text style={styles.digitText}>{(dashboardData.workedHours.split(':')[1] || '00')[0] || '0'}</Text></View>
                    <View style={styles.digitBox}><Text style={styles.digitText}>{(dashboardData.workedHours.split(':')[1] || '00')[1] || '0'}</Text></View>
                  </View>
                  <Text style={styles.digitSub}>MINUTES</Text>
                </View>

                <Text style={styles.colon}>:</Text>

                <View style={styles.digitGroup}>
                  <View style={styles.digitPair}>
                    <View style={styles.digitBox}><Text style={styles.digitText}>{(dashboardData.workedHours.split(':')[2] || '00')[0] || '0'}</Text></View>
                    <View style={styles.digitBox}><Text style={styles.digitText}>{(dashboardData.workedHours.split(':')[2] || '00')[1] || '0'}</Text></View>
                  </View>
                  <Text style={styles.digitSub}>SECONDS</Text>
                </View>
              </View>
            </View>

            <View style={styles.dashboardDivider} />

            <View style={styles.checkInOutRow}>
              <View style={{ alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#4CAF50', marginBottom: 2 }}>Check In</Text>
                <Text style={{ fontSize: 10, color: C.gray600, fontWeight: '600' }}>{new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: C.gray900 }}>{dashboardData.checkIn || '--:--'}</Text>
              </View>

              <IconSymbol name="arrow.right" size={16} color={C.gray200} />

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#FF5252', marginBottom: 2 }}>Check Out</Text>
                <Text style={{ fontSize: 10, color: C.gray600, fontWeight: '600' }}>{new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: C.gray900 }}>{dashboardData.checkOut || '--:--'}</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} onPress={() => setIsCalendarVisible(true)}>
              <View style={[styles.statIconContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F0F3FF' }]}>
                <IconSymbol name="calendar" size={20} color={C.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>{dashboardData.presentDays}</Text>
                <Text style={styles.statLabel}>Present days</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/leave')}>
              <View style={[styles.statIconContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#E8F5E9' }]}>
                <IconSymbol name="location.fill" size={20} color={C.success} />
              </View>
              <View>
                <Text style={styles.statValue}>{dashboardData.leaveBalance}</Text>
                <Text style={styles.statLabel}>Leave balance</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickActionsGrid}>
            <ActionItem icon="calendar.badge.plus" label="Apply Leave" color="#7986CB" onPress={() => router.push('/apply-leave')} />
            <ActionItem icon="door.right.hand.open" label="Gate Pass" color="#4FC3F7" onPress={() => router.push('/gate-pass')} />
            <ActionItem icon="wallet.pass.fill" label="Expense" color="#81C784" onPress={() => router.push('/expense')} />
            <ActionItem icon="clock.fill" label="On Duty" color="#FFB74D" onPress={() => router.push('/on-duty')} />
            <ActionItem icon="banknote.fill" label="Salary Slip" color="#BA68C8" onPress={() => router.push('/salary-slip')} />
            <ActionItem icon="calendar" label="Holidays" color="#F06292" onPress={() => router.push('/holidays')} />
            <ActionItem icon="creditcard.fill" label="Loan/Adv" color="#4DB6AC" onPress={() => router.push('/loan')} />
            <ActionItem icon="building.2.fill" label="Asset" color="#90A4AE" onPress={() => router.push('/asset')} />
            <ActionItem icon="doc.text.fill" label="Policy" color="#FF8A65" />
            <ActionItem icon="star.fill" label="Feedback" color="#FFF176" onPress={() => router.push('/feedback')} />
          </View>

          {/* Attendance Details */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attendance Details</Text>
            <TouchableOpacity onPress={() => router.push('/attend')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.attendanceCard}>
            {recentHistory.length > 0 ? (
              recentHistory.map((day, i) => (
                <React.Fragment key={day.dateKey}>
                  <AttendanceRow
                    date={day.date}
                    checkIn={day.in || '--:--'}
                    checkOut={day.out || '--:--'}
                    status={day.out ? "Present" : "In Office"}
                    color={day.out ? C.success : C.primary}
                  />
                  {i < recentHistory.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: C.gray600 }}>No recent attendance data</Text>
              </View>
            )}
          </View>

          {/* Announcements */}
          <View style={[styles.sectionHeader, { marginTop: 25 }]}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.announcementList}>
            <AnnouncementItem title="Company meeting at 4 PM" time="10:30 AM" dotColor="#4361EE" />
            <View style={styles.divider} />
            <AnnouncementItem title="New policy update" time="09:15 AM" dotColor="#FF9800" />
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Calendar Modal */}
        <Modal visible={isCalendarVisible} transparent animationType="fade" onRequestClose={() => setIsCalendarVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setIsCalendarVisible(false)}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Attendance Calendar</Text>
                <TouchableOpacity onPress={() => setIsCalendarVisible(false)} style={styles.closeBtn}>
                  <IconSymbol name="xmark" size={24} color={C.gray900} />
                </TouchableOpacity>
              </View>
              <View style={styles.weekDays}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text key={i} style={styles.weekDayText}>{d}</Text>)}
              </View>
              <View style={styles.calendarGrid}>
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                  const log = getLogForDay(day);
                  const isPresent = log && (log.status === 'Present' || log.status === 'Half Day' || (log.in_time && log.in_time !== '--:--'));
                  const isLeave = log && (log.status === 'On Leave' || log.status === 'Leave');
                  const isAbsent = log && log.status === 'Absent';
                  const isSelected = selectedDay === day;
                  
                  return (
                    <TouchableOpacity key={day} style={styles.dayBox} onPress={() => setSelectedDay(day)}>
                      <View style={[
                        styles.dayCircle, 
                        isPresent && styles.presentBox, 
                        isLeave && styles.leaveBox, 
                        isAbsent && styles.absentBox,
                        isSelected && styles.selectedDayCircle
                      ]}>
                        <Text style={[styles.dayText, (isPresent || isLeave || isAbsent || isSelected) && styles.whiteText]}>{day}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedDay && (
                <View style={styles.dayDetailsContainer}>
                  <Text style={styles.dayDetailsTitle}>Details for {selectedDay} Apr</Text>
                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <IconSymbol name="arrow.down.left.circle.fill" size={16} color={C.primary} />
                      <View>
                        <Text style={styles.detailLabel}>Check-in</Text>
                        <Text style={styles.detailValue}>{getDayDetails(selectedDay).checkIn}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <IconSymbol name="arrow.up.right.circle.fill" size={16} color={C.danger} />
                      <View>
                        <Text style={styles.detailLabel}>Check-out</Text>
                        <Text style={styles.detailValue}>{getDayDetails(selectedDay).checkOut}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <IconSymbol name="timer" size={16} color={C.success} />
                      <View>
                        <Text style={styles.detailLabel}>Working Hours</Text>
                        <Text style={styles.detailValue}>{getDayDetails(selectedDay).workingHours}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <IconSymbol name="bell.fill" size={16} color={C.warning} />
                      <View>
                        <Text style={styles.detailLabel}>Shift Type</Text>
                        <Text style={styles.detailValue}>{getDayDetails(selectedDay).shift}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}