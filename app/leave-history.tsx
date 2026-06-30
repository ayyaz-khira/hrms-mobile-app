import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getSecureToken } from '../services/secureStore';

export default function LeaveHistoryScreen() {
  const { isDarkMode } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getSecureToken();
      const userId = await AsyncStorage.getItem('user_id');

      if (!token || !userId) {
        setLoading(false);
        return;
      }

      const authHeader = token.trim();

      const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_leave_applications', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'sid': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ employee: userId.trim() })
      });

      if (response.ok) {
        const result = await response.json();
        const message = result.message;
        const data = message?.data || (Array.isArray(message) ? message : []);

        if (Array.isArray(data)) {
          const mapped = data.map((l: any, index: number) => ({
            id: String(l.name || index),
            type: l.leave_type || 'Leave Request',
            range: `${l.from_date} - ${l.to_date}`,
            days: `${l.total_leave_days} days`,
            status: l.status || 'Pending',
            color: l.status === 'Approved' ? '#4CAF50' : (l.status === 'Rejected' ? '#F44336' : '#FF9800'),
            date: `Applied on ${l.posting_date || 'N/A'}`
          }));
          setRequests(mapped);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leave history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const C = {
    primary: '#4361EE',
    success: '#4CAF50',
    danger: '#F44336',
    warning: '#FF9800',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    gray50: isDarkMode ? '#334155' : '#F8F9FA',
    gray100: isDarkMode ? '#334155' : '#F1F3F5',
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
              <Text style={styles.headerTitle}>Leave History</Text>
              <View style={styles.headerIconContainer}>
                <IconSymbol name="list.bullet.indent" size={20} color="#FFFFFF" />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={{ marginTop: 10, color: C.subText }}>Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 50 }}
          ListEmptyComponent={
            <View style={{ marginTop: 50, alignItems: 'center' }}>
              <IconSymbol name="calendar.badge.exclamationmark" size={50} color={C.gray100} />
              <Text style={{ marginTop: 20, color: C.subText, fontSize: 16 }}>No leave records found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.requestCard, { backgroundColor: C.card }]}>
              <View style={[styles.statusStrip, { backgroundColor: item.color }]} />
              <View style={styles.cardMain}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.leaveType, { color: C.text }]}>{item.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.statusText, { color: item.color }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <IconSymbol name="calendar" size={14} color={C.subText} />
                    <Text style={[styles.detailText, { color: C.subText }]}>{item.range}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <IconSymbol name="clock.fill" size={14} color={C.subText} />
                    <Text style={[styles.detailText, { color: C.subText }]}>{item.days}</Text>
                  </View>
                </View>
                <View style={[styles.cardFooter, { borderTopColor: C.gray100 }]}>
                  <Text style={[styles.appliedDate, { color: C.subText }]}>{item.date}</Text>
                  <IconSymbol name="chevron.right" size={14} color={C.subText} />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
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
  filterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  headerIconContainer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  logoContainer: { width: 80, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  logo: { width: '100%', height: '100%' },
  requestCard: { borderRadius: 24, flexDirection: 'row', marginBottom: 15, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statusStrip: { width: 6, height: '100%' },
  cardMain: { flex: 1, padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  leaveType: { fontSize: 16, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardDetails: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12 },
  appliedDate: { fontSize: 11, fontWeight: '600' },
});
