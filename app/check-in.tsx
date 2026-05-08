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
import { useTheme } from '../context/ThemeContext';

const GET_CHECKINS_API = 'https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_checkins';
const PUNCH_API = 'https://staging.microcrispr.com/api/method/hrms_application.api.employee_checkin';

export default function CheckInScreen() {
  const { isDarkMode } = useTheme();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      let token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');

      // Auto-fix: If token is legacy (no prefix) and looks like key:secret, add prefix
      if (token && !token.startsWith('token ') && token.includes(':')) {
        token = `token ${token}`;
        await AsyncStorage.setItem('user_token', token);
      }

      if (!token || !userId) return;

      const response = await fetch(GET_CHECKINS_API, {
        method: 'POST',
        headers: {
          Authorization: token || '',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ employee: userId }),
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
          const hour = new Date(log.time).getHours();

          if (type === 'IN' && !earliestIn) {
            earliestIn = log;
          }
          if (type === 'OUT') {
            latestOut = log; // keep updating for latest
          }

          // Fallback logic if no explicit type
          if (!earliestIn && hour < 12) earliestIn = log; // AM log
          if (!latestOut && hour >= 12) latestOut = log; // PM log
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

    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        });
      }

      const entry = map.get(key);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const hour = d.getHours();
      const type = getLogType(log);

      if (type === 'IN' || (hour < 13 && !entry.in)) {
        entry.in = timeStr;
      } else if (type === 'OUT' || (hour >= 12 && !entry.out)) {
        entry.out = timeStr;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  };

  const handlePunch = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');

      if (!token || !userId) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/login' as any);
        return;
      }

      const punchType = isCheckedIn ? 'OUT' : 'IN';

      const response = await fetch(PUNCH_API, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          employee: userId,
          log_type: punchType,
          timestamp: new Date().toISOString(),
          location: locationName,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', `Successfully punched ${punchType}`);
        await fetchTodayLogs();
      } else {
        const res = await response.json().catch(() => ({}));
        if (response.status === 417) {
          Alert.alert('Status Conflict', `Server says you are already punched ${punchType === 'IN' ? 'IN' : 'OUT'}. Please refresh.`);
          await fetchTodayLogs(); // Sync state
        } else {
          Alert.alert('Punch Failed', res?.message || 'Failed');
        }
      }
    } catch (error) {
      console.error('Punch Error:', error);
      Alert.alert('Error', 'Failed to communicate with server');
    } finally {
      setLoading(false);
    }
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

        {/* Punch Button */}
        <View style={styles.punchContainer}>
          <TouchableOpacity
            style={[
              styles.punchButton,
              {
                backgroundColor: isCheckedIn ? C.card : C.primary,
                height: isCheckedIn ? 220 : 100,
                borderWidth: isCheckedIn ? 1 : 0,
                borderColor: isDarkMode ? '#334155' : '#E9ECEF',
                padding: isCheckedIn ? 20 : 0
              }
            ]}
            onPress={handlePunch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <View style={{ width: '100%' }}>
                {isCheckedIn ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: '700', marginBottom: 15, letterSpacing: 0.5 }}>Total Worked Hours</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
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
                        <View style={{ flexDirection: 'row', gap: 3 }}>
                          <View style={styles.digitBox}><Text style={styles.digitText}>{(workedTime.split(':')[2] || '00')[0] || '0'}</Text></View>
                          <View style={styles.digitBox}><Text style={styles.digitText}>{(workedTime.split(':')[2] || '00')[1] || '0'}</Text></View>
                        </View>
                        <Text style={styles.digitSub}>SECONDS</Text>
                      </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: isDarkMode ? '#334155' : '#E9ECEF', width: '100%', marginBottom: 15 }} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 }}>
                      <View style={{ alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#4CAF50', marginBottom: 2 }}>Check In</Text>
                        <Text style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: '600' }}>{new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? '#F8F9FB' : '#1B1B2F' }}>{lastCheckIn || '--:--'}</Text>
                      </View>

                      <IconSymbol name="arrow.right" size={16} color={isDarkMode ? '#334155' : '#CED4DA'} />

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#F44336', marginBottom: 2 }}>Check Out</Text>
                        <Text style={{ fontSize: 10, color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: '600' }}>{new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? '#F8F9FB' : '#1B1B2F' }}>--:--</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <IconSymbol name="hand.tap.fill" size={24} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>START SHIFT</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>Tap to punch in for today</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
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
