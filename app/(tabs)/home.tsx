import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { isDarkMode } = useTheme();
  
  const C = {
    primary: '#4361EE',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    white: isDarkMode ? '#1E293B' : '#FFFFFF',
    gray50: isDarkMode ? '#334155' : '#F8F9FA',
    gray100: isDarkMode ? '#1E293B' : '#F1F3F5',
    gray200: isDarkMode ? '#334155' : '#E9ECEF',
    gray400: isDarkMode ? '#64748B' : '#CED4DA',
    gray600: isDarkMode ? '#94A3B8' : '#868E96',
    gray900: isDarkMode ? '#F8F9FB' : '#212529',
    success: '#4CAF50',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
  };

  const [userName, setUserName] = useState('Harsh');
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

  useFocusEffect(
    useCallback(() => {
      const loadDashboard = async () => {
        try {
          const savedName = await AsyncStorage.getItem('user_name');
          if (savedName) setUserName(savedName);

          let token = await AsyncStorage.getItem('user_token');
          const userId = await AsyncStorage.getItem('user_id');

          // Auto-fix legacy tokens
          if (token && !token.startsWith('token ') && token.includes(':')) {
            token = `token ${token}`;
            await AsyncStorage.setItem('user_token', token);
          }
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://staging.microcrispr.com/api/method/hrms_application.api.mobile_login';
          const baseApi = apiUrl.split('/api/')[0];
          
          // Background fetch employee details to cache them
          fetch(`${baseApi}/api/method/hrms_application.api.get_employee_details`, {
            method: 'POST',
            headers: {
              'Authorization': token || '',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ employee: userId })
          }).then(res => res.json()).then(async (result) => {
            if (result.message) {
              await AsyncStorage.setItem('employee_details', JSON.stringify(result.message));
              if (result.message.employee_name) setUserName(result.message.employee_name);
            }
          }).catch(err => console.error('BG Fetch Error:', err));

          // Load Dashboard
          try {
            const response = await fetch(`${baseApi}/api/method/hrms_application.api.get_employee_checkins`, {
              method: 'POST',
              headers: {
                'Authorization': token || '',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({ employee: userId })
            });

            if (!response.ok) {
              // Fail silently in background
              return;
            }

            const data = await response.json();
              const logs = data.message || [];
              
              if (logs.length > 0) {
                // Latest status
                const latest = logs[0];
                setIsCheckedIn(latest.log_type === 'IN');
                
                // Grouping for dashboard display
                const grouped = logs.reduce((acc: any[], log: any) => {
                  if (!log.time) return acc;
                  const d = new Date(log.time);
                  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  
                  let dayEntry = acc.find(item => item.dateKey === dateKey);
                  if (!dayEntry) {
                    dayEntry = { 
                      dateKey, 
                      date: d.toLocaleDateString([], { day: '2-digit', month: 'short' }),
                      in: null, 
                      out: null,
                      inRaw: null,
                      outRaw: null
                    };
                    acc.push(dayEntry);
                  }
                  const logTime = new Date(log.time);
                  const timeStr = logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const type = log.log_type?.toUpperCase();
                  
                  if (type === 'IN') {
                    if (!dayEntry.inRaw || logTime < dayEntry.inRaw) {
                      dayEntry.in = timeStr;
                      dayEntry.inRaw = logTime;
                    }
                  } else if (type === 'OUT') {
                    if (!dayEntry.outRaw || logTime > dayEntry.outRaw) {
                      dayEntry.out = timeStr;
                      dayEntry.outRaw = logTime;
                    }
                  }
                  return acc;
                }, []);
                
                setRecentHistory(grouped.slice(0, 5));

                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const todayEntry = grouped.find(g => g.dateKey === today);
                
                if (todayEntry) {
                  setDashboardData(prev => ({
                    ...prev,
                    checkIn: todayEntry.in || '--:--',
                    checkOut: todayEntry.out || '--:--'
                  }));
                  const isCurrentlyIn = !!todayEntry.in && !todayEntry.out;
                  setIsCheckedIn(isCurrentlyIn);
                  if (isCurrentlyIn && todayEntry.inRaw) {
                    setLastCheckInRaw(new Date(todayEntry.inRaw));
                  } else {
                    setLastCheckInRaw(null);
                  }
                } else {
                  setIsCheckedIn(false);
                  setLastCheckInRaw(null);
                  setDashboardData(prev => ({ ...prev, checkIn: '--:--', checkOut: '--:--', workedHours: '00:00:00' }));
                }
              }
          } catch (e) {
            console.error('Failed to load dashboard logs', e);
          }
        } catch (e) {
          console.error('Failed to load dashboard', e);
        }
      };
      loadDashboard();
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
      const token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');
      
      const punchType = isCheckedIn ? 'OUT' : 'IN';
      const apiUrl = 'https://staging.microcrispr.com/api/method/hrms_application.api.employee_checkin';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employee: userId,
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
          [punchType === 'IN' ? 'checkIn' : 'checkOut']: now
        }));
        Alert.alert('Success', `Successfully punched ${punchType.toLowerCase()} at ${now}`);
      } else {
        const res = await response.json();
        Alert.alert('Error', res.message || 'Failed to record attendance');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setIsPunching(false);
    }
  };

  const presentDays = [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30];
  const absentDays: number[] = []; 
  const leaveDays = [6, 13, 20, 27];

  const getDayDetails = (day: number) => {
    if (presentDays.includes(day)) return { checkIn: '09:30 AM', checkOut: '06:30 PM', workingHours: '09h 00m', shift: 'Day Shift' };
    if (leaveDays.includes(day)) return { checkIn: '-', checkOut: '-', workingHours: '-', shift: '-' };
    return { checkIn: 'N/A', checkOut: 'N/A', workingHours: 'N/A', shift: 'N/A' };
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
    checkCol: { alignItems: 'center', flex: 1 },
    checkStatus: { fontSize: 11, fontWeight: '800', marginBottom: 1 },
    checkDate: { fontSize: 9, fontWeight: '600', color: C.gray400 },
    checkTime: { fontSize: 12, fontWeight: '800', color: C.gray900 },
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
    announcementsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seeAllText: { fontSize: 12, color: '#3F51B5', fontWeight: '600', marginBottom: 15 },
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
    statusBanner: { marginTop: 15, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
    statusBannerText: { fontSize: 12, fontWeight: '800' },
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
    punchActionBtn: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      marginTop: -5,
    }
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
          <TouchableOpacity style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>{userName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Dashboard Header */}
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
              <Text style={styles.seeAllText}>See all</Text>
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
                {/* April 2026 starts on Wednesday - Add 2 empty boxes for Mon, Tue */}
                {[null, null].map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayBox} />
                ))}
                {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                  const isPresent = presentDays.includes(day);
                  const isLeave = leaveDays.includes(day);
                  const isSelected = selectedDay === day;
                  return (
                    <TouchableOpacity key={day} style={styles.dayBox} onPress={() => setSelectedDay(day)}>
                      <View style={[styles.dayCircle, isPresent && styles.presentBox, isLeave && styles.leaveBox, isSelected && styles.selectedDayCircle]}>
                        <Text style={[styles.dayText, (isPresent || isLeave || isSelected) && styles.whiteText]}>{day}</Text>
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
