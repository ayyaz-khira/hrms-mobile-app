import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureToken } from '../services/secureStore';
import Skeleton from '@/components/ui/skeleton';
import { useTheme } from '../context/ThemeContext';

const GET_CHECKINS_API = 'https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_checkins';

export default function CheckInScreen() {
  const { isDarkMode } = useTheme();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [lastCheckInRaw, setLastCheckInRaw] = useState<Date | null>(null);
  const [workedTime, setWorkedTime] = useState('00:00:00');
  const [lastCheckOut, setLastCheckOut] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('Determining location...');
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  const C = {
    primary: '#4361EE',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    success: '#4CAF50',
    danger: '#F44336',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    white: '#FFFFFF',
  };

  const extractLogs = (result: any): any[] => {
    console.log('API Response Structure:', Object.keys(result || {}));
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.message)) return result.message;
    if (result.message?.data && Array.isArray(result.message.data)) return result.message.data;
    if (result.message?.logs && Array.isArray(result.message.logs)) return result.message.logs;
    if (result.data && Array.isArray(result.data)) return result.data;
    return [];
  };

  const getLogType = (log: any): string => {
    return (log.log_type || log.type || '').toString().toUpperCase().trim();
  };

  const fetchTodayLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = await getSecureToken();
      const userId = await AsyncStorage.getItem('user_id');

      if (!token || !userId) return;

      const response = await fetch(GET_CHECKINS_API, {
        credentials: 'include',
        method: 'POST',
        headers: {
          Authorization: token.trim(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ 
          employee: userId,
          limit_page_length: 200 // Increased limit to see more history
        }),
      });

      if (!response.ok) {
        // Silently fail for background refreshes to avoid popups
        return;
      }

      const result = await response.json();
      const allLogs = extractLogs(result);

      const now = new Date();
      const todayLogs = allLogs.filter((l: any) => {
        if (!l.time) return false;
        const logDate = new Date(l.time);
        return (
          logDate.getDate() === now.getDate() &&
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      }).sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

      let checkInTime: string | null = null;
      let checkOutTime: string | null = null;

      if (todayLogs.length > 0) {
        // Find earliest IN (AM) and latest OUT (PM)
        let earliestIn: any = null;
        let latestOut: any = null;

        for (const log of todayLogs) {
          const type = getLogType(log);
          const d = new Date(log.time);
          const hour = d.getHours();

          if (type === 'IN') {
            if (!earliestIn || d < new Date(earliestIn.time)) earliestIn = log;
          } else if (type === 'OUT') {
            if (!latestOut || d > new Date(latestOut.time)) latestOut = log;
          } else {
            // Fallback logic if no explicit type
            if (hour < 12) {
              if (!earliestIn || d < new Date(earliestIn.time)) earliestIn = log;
            } else {
              if (!latestOut || d > new Date(latestOut.time)) latestOut = log;
            }
          }
        }

        if (earliestIn) {
          checkInTime = new Date(earliestIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastCheckInRaw(new Date(earliestIn.time));
        } else {
          setLastCheckInRaw(null);
        }

        if (latestOut) {
          checkOutTime = new Date(latestOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Final fallback
        if (!checkInTime && todayLogs.length > 0) {
          checkInTime = new Date(todayLogs[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }

      console.log('Processed Today Logs count:', todayLogs.length);
      console.log('Check-In:', checkInTime, 'Check-Out:', checkOutTime);

      // Sticky update: only update critical state if we get valid data or if it's initial load/manual refresh
      const grouped = groupLogsByDate(allLogs);
      if (grouped.length > 0 || !isRefresh) {
        setLastCheckIn(checkInTime);
        setLastCheckOut(checkOutTime);
        setIsCheckedIn(!!checkInTime && !checkOutTime);
        setRecentHistory(grouped);
      }
      setHasFetchedOnce(true);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const CheckInHistoryRowSkeleton = () => (
    <View style={[styles.historyItem, { backgroundColor: C.card }]}>
      <View style={styles.historyDateCol}>
        <Skeleton width={30} height={14} style={{ marginBottom: 4 }} />
        <Skeleton width={45} height={10} />
      </View>
      <View style={styles.historyDetailsCol}>
        <View style={styles.historyTimeRow}>
          <View style={styles.historyTimeSubRow}>
            <Skeleton width={18} height={10} style={{ marginRight: 6 }} />
            <Skeleton width={40} height={12} />
          </View>
          <View style={styles.historyTimeSubRow}>
            <Skeleton width={24} height={10} style={{ marginRight: 6 }} />
            <Skeleton width={40} height={12} />
          </View>
        </View>
      </View>
    </View>
  );

  const groupLogsByDate = (logs: any[]) => {
    const map = new Map();

    logs.forEach((log) => {
      if (!log.time) return;
      const d = new Date(log.time);
      const key = d.toISOString().split('T')[0];

      if (!map.has(key)) {
        map.set(key, {
          dateKey: key,
          monthDay: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          weekday: d.toLocaleDateString([], { weekday: 'short' }),
          in: null,
          out: null,
          inRaw: null,
          outRaw: null,
        });
      }

      const entry = map.get(key);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const type = getLogType(log);

      // Earliest log of the day is IN (unless explicit type says otherwise)
      if (type === 'IN' || !entry.inRaw || d < entry.inRaw) {
        if (type === 'IN' || !entry.inRaw || d < entry.inRaw) {
           // If we already have an IN but this one is earlier, move the old IN to OUT if OUT is empty
           if (entry.inRaw && d < entry.inRaw && !entry.outRaw) {
              entry.out = entry.in;
              entry.outRaw = entry.inRaw;
           }
           entry.in = timeStr;
           entry.inRaw = d;
        }
      }
      
      // Latest log of the day is OUT (unless it's the only log and looks like an IN)
      if (type === 'OUT' || !entry.outRaw || d > entry.outRaw) {
         if (d > entry.inRaw) {
            entry.out = timeStr;
            entry.outRaw = d;
         }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  };


  const onRefresh = () => fetchTodayLogs(true);

  useEffect(() => {
    setTimeout(() => setLocationName('Main Office - Tower A, 4th Floor'), 1500);
  }, []);

  useEffect(() => {
    fetchTodayLogs();
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    const refreshTimer = setInterval(fetchTodayLogs, 45000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(refreshTimer);
    };
  }, [fetchTodayLogs]);

  useEffect(() => {
    let interval: any;
    if (isCheckedIn && lastCheckInRaw) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.max(0, now.getTime() - lastCheckInRaw.getTime());
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setWorkedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setWorkedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, lastCheckInRaw]);

  const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    headerContainer: { backgroundColor: 'transparent', zIndex: 10 },
    headerBg: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    scrollContent: { paddingBottom: 50 },
    clockSection: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
    timeText: { fontSize: 48, fontWeight: '900', letterSpacing: 2 },
    dateText: { fontSize: 16, fontWeight: '600', marginTop: 5 },
    statusCard: { marginHorizontal: 30, borderRadius: 20, padding: 15, marginBottom: 40 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
    locationText: { fontSize: 14, fontWeight: '600' },
    punchContainer: { paddingHorizontal: 30, marginBottom: 40 },
    punchButton: {
      width: '100%',
      height: 110,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }
    },
    punchButtonInner: { alignItems: 'center', gap: 10 },
    punchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
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
    digitText: { fontSize: 20, fontWeight: '800', color: '#4361EE' },
    digitSub: { fontSize: 7, fontWeight: '800', color: isDarkMode ? '#94A3B8' : '#ADB5BD', letterSpacing: 0.5 },
    colon: { fontSize: 18, fontWeight: '800', color: '#4361EE', marginTop: -15, paddingHorizontal: 1 },
    hintText: { fontSize: 13, fontWeight: '600', marginTop: 20 },
    logsSection: { paddingHorizontal: 30, marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
    logsGrid: { flexDirection: 'row', gap: 15 },
    logItem: { flex: 1, padding: 15, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
    logIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    logLabel: { fontSize: 10, fontWeight: '800' },
    logValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
    historySection: { paddingHorizontal: 30, paddingBottom: 30 },
    historyItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, elevation: 2 },
    historyDateCol: { width: 65 },
    historyMonthDay: { fontSize: 15, fontWeight: '800' },
    historyWeekday: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    historyDetailsCol: { flex: 1, paddingLeft: 10 },
    historyTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 30 },
    historyTimeSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    historyTypeTag: { fontSize: 11, fontWeight: '900', width: 30 },
    historyTimeValue: { fontSize: 14, fontWeight: '700' },
    emptyState: { padding: 40, borderRadius: 24, alignItems: 'center' },
    staticCard: { borderRadius: 30, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    staticTimerBox: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    statusTable: { borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    tableHeader: { padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(67, 97, 238, 0.05)' },
    tableHeaderText: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
    tableBody: { padding: 5 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
    tableLabel: { fontSize: 14, fontWeight: '700' },
    tableValue: { fontSize: 15, fontWeight: '800' },
    hoursBadge: { backgroundColor: '#4361EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    hoursText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  });

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <IconSymbol name="arrow.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Check In / Out</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Clock */}
        <View style={styles.clockSection}>
          <Text style={[styles.timeText, { color: C.text, fontSize: 42 }]}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
          <Text style={[styles.dateText, { color: C.subText, fontSize: 14 }]}>
            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>

        {/* Location */}
        <View style={[styles.statusCard, { backgroundColor: C.card }]}>
          <View style={styles.locationRow}>
            <IconSymbol name="location.fill" size={18} color={C.primary} />
            <Text style={[styles.locationText, { color: C.subText }]}>{locationName}</Text>
          </View>
        </View>

        {/* Today's Activity (Read Only) */}
        <View style={styles.punchContainer}>
           <View style={[styles.staticCard, { backgroundColor: isDarkMode ? '#1E293B' : '#E9ECEF' }]}>
              <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: '800', textAlign: 'center', marginTop: 15, marginBottom: 15 }}>Total Worked Hours</Text>
              
              <View style={[styles.staticTimerBox, { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', borderRadius: 15, padding: 15, marginHorizontal: 15, marginBottom: 20 }]}>
                 {(!hasFetchedOnce && loading) ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6 }}>
                       <View style={{ alignItems: 'center', gap: 6 }}>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                             <Skeleton width={24} height={32} borderRadius={6} />
                             <Skeleton width={24} height={32} borderRadius={6} />
                          </View>
                          <Skeleton width={32} height={8} />
                       </View>
                       <Text style={[styles.colon, { marginTop: -6 }]}>:</Text>
                       <View style={{ alignItems: 'center', gap: 6 }}>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                             <Skeleton width={24} height={32} borderRadius={6} />
                             <Skeleton width={24} height={32} borderRadius={6} />
                          </View>
                          <Skeleton width={40} height={8} />
                       </View>
                       <Text style={[styles.colon, { marginTop: -6 }]}>:</Text>
                       <View style={{ alignItems: 'center', gap: 6 }}>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                             <Skeleton width={24} height={32} borderRadius={6} />
                             <Skeleton width={24} height={32} borderRadius={6} />
                          </View>
                          <Skeleton width={44} height={8} />
                       </View>
                    </View>
                 ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                       <View style={{ alignItems: 'center', gap: 6 }}>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                             <View style={styles.digitBox}><Text style={styles.digitText}>{(workedTime.split(':')[0] || '00')[0] || '0'}</Text></View>
                             <View style={styles.digitBox}><Text style={styles.digitText}>{(workedTime.split(':')[0] || '00')[1] || '0'}</Text></View>
                          </View>
                          <Text style={styles.digitSub}>HOURS</Text>
                       </View>
                       <Text style={styles.colon}>:</Text>
                       <View style={{ alignItems: 'center', gap: 6 }}>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                             <View style={styles.digitBox}><Text style={styles.digitText}>{(workedTime.split(':')[1] || '00')[0] || '0'}</Text></View>
                             <View style={styles.digitBox}><Text style={styles.digitText}>{(workedTime.split(':')[1] || '00')[1] || '0'}</Text></View>
                          </View>
                          <Text style={styles.digitSub}>MINUTES</Text>
                       </View>
                       <Text style={styles.colon}>:</Text>
                       <View style={{ alignItems: 'center', gap: 6 }}>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                             <View style={styles.digitBox}><Text style={styles.digitText}>{(workedTime.split(':')[2] || '00')[0] || '0'}</Text></View>
                             <View style={styles.digitBox}><Text style={styles.digitText}>{(workedTime.split(':')[2] || '00')[1] || '0'}</Text></View>
                          </View>
                          <Text style={styles.digitSub}>SECONDS</Text>
                       </View>
                    </View>
                 )}
              </View>

              <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)', width: '100%', marginBottom: 15 }} />
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingBottom: 20 }}>
                 <View style={{ alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#4CAF50', marginBottom: 2 }}>Check In</Text>
                    {(!hasFetchedOnce && loading) ? (
                       <Skeleton width={50} height={16} style={{ marginTop: 2 }} />
                    ) : (
                       <Text style={{ fontSize: 14, fontWeight: '900', color: C.text }}>{lastCheckIn || '--:--'}</Text>
                    )}
                 </View>
 
                 <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#F44336', marginBottom: 2 }}>Check Out</Text>
                    {(!hasFetchedOnce && loading) ? (
                       <Skeleton width={50} height={16} style={{ marginTop: 2 }} />
                    ) : (
                       <Text style={{ fontSize: 14, fontWeight: '900', color: C.text }}>{lastCheckOut || '--:--'}</Text>
                    )}
                 </View>
              </View>
           </View>
        </View>

        {/* Recent History */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Recent History</Text>

          {recentHistory.length > 0 ? (
            recentHistory.map((day, index) => (
              <View key={index} style={[styles.historyItem, { backgroundColor: C.card }]}>
                <View style={styles.historyDateCol}>
                  <Text style={[styles.historyMonthDay, { color: C.text }]}>{day.monthDay}</Text>
                  <Text style={[styles.historyWeekday, { color: C.subText }]}>{day.weekday}</Text>
                </View>

                <View style={styles.historyDetailsCol}>
                  <View style={styles.historyTimeRow}>
                    <View style={styles.historyTimeSubRow}>
                      <Text style={[styles.historyTypeTag, { color: C.success }]}>IN</Text>
                      <Text style={[styles.historyTimeValue, { color: C.text }]}>{day.in || '--:--'}</Text>
                    </View>
                    <View style={styles.historyTimeSubRow}>
                      <Text style={[styles.historyTypeTag, { color: C.danger }]}>OUT</Text>
                      <Text style={[styles.historyTimeValue, { color: C.text }]}>{day.out || '--:--'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (!hasFetchedOnce && (loading || refreshing)) ? (
            <React.Fragment>
              <CheckInHistoryRowSkeleton />
              <CheckInHistoryRowSkeleton />
              <CheckInHistoryRowSkeleton />
            </React.Fragment>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: C.card }]}>
              <Text style={{ color: C.subText }}>No recent activity found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
