import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '../../context/ThemeContext';
import { useLeaveStore } from '../../store/leaveStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const getLeaveColor = (type: string, index: number) => {
  const colors = ['#4361EE', '#FF9800', '#2EC4B6', '#E71D36', '#9C27B0', '#00F5D4', '#7209B7'];
  return colors[index % colors.length];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Approved': return '#10B981';
    case 'Rejected': return '#EF4444';
    case 'Pending': return '#F59E0B';
    default: return '#4361EE';
  }
};

export default function LeaveTrackerScreen() {
  const { isDarkMode } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { leaveBalances, myRequests, fetchLeaveBalances, fetchMyRequests, roles } = useLeaveStore();
  const isApprover = roles.includes('Leave Approver');
  const useCompactActions = isApprover && screenWidth < 390;

  useFocusEffect(
    useCallback(() => {
      const loadLeaveData = async () => {
        const userId = await AsyncStorage.getItem('user_id');
        if (userId) {
          await fetchLeaveBalances(userId);
          await fetchMyRequests(userId);
        }
      };
      loadLeaveData();
    }, [])
  );

  const C = {
    primary: '#4361EE',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    bg: isDarkMode ? '#0B0E14' : '#F8F9FB',
    card: isDarkMode ? '#161B22' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#212529',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#050505' : '#1B1B2F',
    gray50: isDarkMode ? '#1F2937' : '#F8F9FA',
    gray100: isDarkMode ? '#374151' : '#F1F3F5',
  };

  // Safe defaults if store is empty
  const balances = leaveBalances.length > 0 ? leaveBalances : [
    { leave_type: 'Casual', leaves_taken: 2, max_leaves: 12, balance: 10 },
    { leave_type: 'Sick', leaves_taken: 1, max_leaves: 8, balance: 7 },
    { leave_type: 'Privilege', leaves_taken: 5, max_leaves: 15, balance: 10 },
    { leave_type: 'Comp Off', leaves_taken: 0, max_leaves: 4, balance: 4 }
  ];

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      {/* Fixed Header */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backBtn}>
                <IconSymbol name="arrow.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Leave Tracker</Text>
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
        <View style={styles.summaryGrid}>
          {balances.map((bal, idx) => (
            <View key={idx} style={[styles.summaryCard, { backgroundColor: getLeaveColor(bal.leave_type, idx) }]}>
              <Text style={styles.summaryLabel}>{bal.leave_type}</Text>
              <Text style={styles.summaryValue}>{bal.leaves_taken}/{bal.max_leaves}</Text>
              <Text style={styles.summarySub}>Remaining: {bal.balance || (bal.max_leaves - bal.leaves_taken)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.actionRow, useCompactActions && styles.compactActionRow]}>
          <TouchableOpacity style={[styles.mainAction, useCompactActions && styles.compactMainAction, { backgroundColor: C.primary }]} onPress={() => router.push('/apply-leave')}>
            <IconSymbol name="plus" size={22} color="#FFFFFF" />
            <Text style={styles.mainActionText}>Apply New Leave</Text>
          </TouchableOpacity>
          {/* Approver‑only button */}
          {isApprover && (
            <TouchableOpacity
              style={[styles.mainAction, useCompactActions && styles.compactMainAction, { backgroundColor: C.success }]}
              onPress={() => router.push('/approvals')}>
              <IconSymbol name="checkmark.seal.fill" size={22} color="#FFFFFF" />
              <Text style={styles.mainActionText}>Approve Leaves</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.sideAction, useCompactActions && styles.compactSideAction, { backgroundColor: C.card }]} onPress={() => router.push('/leave-history')}>
            <IconSymbol name="list.bullet.indent" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Active Requests</Text>
        </View>

        <View style={styles.requestList}>
          {myRequests.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: C.card }]}>
              <IconSymbol name="calendar.badge.exclamationmark" size={32} color={C.gray100} />
              <Text style={[styles.emptyText, { color: C.subText }]}>No active leave requests</Text>
            </View>
          ) : (
            myRequests.slice(0, 3).map((item, i) => {
              const statusColor = getStatusColor(item.status);
              return (
                <View key={i} style={[styles.requestCard, { backgroundColor: C.card }]}>
                  <View style={styles.requestTop}>
                    <View>
                      <Text style={[styles.requestType, { color: C.text }]}>{item.leave_type}</Text>
                      <Text style={[styles.requestRange, { color: C.subText }]}>{item.from_date} - {item.to_date}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={[styles.divider, { backgroundColor: C.gray100 }]} />
                  <View style={styles.requestBottom}>
                    <View style={styles.metaItem}>
                      <IconSymbol name="clock.fill" size={14} color={C.subText} />
                      <Text style={[styles.metaText, { color: C.subText }]}>{item.total_leave_days} days</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/leave-history')}>
                      <Text style={[styles.detailsText, { color: C.primary }]}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: C.text }]}>Leave Calendar</Text>
            </View>

            <View style={[styles.calendarPreview, { backgroundColor: C.card }]}>
               <View style={styles.calHeader}>
                  <Text style={[styles.calMonth, { color: C.text }]}>May 2026</Text>
               </View>
               <View style={styles.calDays}>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                     <View key={d} style={styles.calDayBox}>
                        <Text style={[styles.calDayText, { color: C.subText }]}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][d - 1]}</Text>
                        <View style={[styles.calDateCircle, d === 5 && { backgroundColor: C.primary }]}>
                           <Text style={[styles.calDateText, { color: d === 5 ? '#FFF' : C.text }]}>{d + 10}</Text>
                        </View>
                     </View>
                  ))}
               </View>
            </View>
         </ScrollView>
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
   summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
   summaryCard: { width: (width - 52) / 2, borderRadius: 20, padding: 15, elevation: 4 },
   summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
   summaryValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginBottom: 4 },
   summarySub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
   actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 25 },
   compactActionRow: { flexWrap: 'wrap' },
   mainAction: { flex: 1, minWidth: 0, minHeight: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8, elevation: 4 },
   compactMainAction: { flexBasis: (width - 52) / 2, height: 64 },
   mainActionText: { flexShrink: 1, color: '#FFFFFF', fontSize: 14, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
   sideAction: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 2 },
   compactSideAction: { flex: 1, height: 48 },
   sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
   sectionTitle: { fontSize: 16, fontWeight: '800' },
   requestList: { paddingHorizontal: 20, gap: 15 },
   emptyCard: { borderRadius: 24, padding: 30, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)' },
   emptyText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
   requestCard: { borderRadius: 24, padding: 20, elevation: 2 },
   requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
   requestType: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
   requestRange: { fontSize: 12, fontWeight: '600' },
   statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
   statusText: { fontSize: 10, fontWeight: '800' },
   divider: { height: 1, marginBottom: 15 },
   requestBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
   metaText: { fontSize: 12, fontWeight: '700' },
   detailsText: { fontSize: 12, fontWeight: '800' },
   calendarPreview: { marginHorizontal: 20, borderRadius: 24, padding: 20, elevation: 2 },
   calHeader: { marginBottom: 15 },
   calMonth: { fontSize: 15, fontWeight: '800' },
   calDays: { flexDirection: 'row', justifyContent: 'space-between' },
   calDayBox: { alignItems: 'center', gap: 8 },
   calDayText: { fontSize: 11, fontWeight: '700' },
   calDateCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
   calDateText: { fontSize: 13, fontWeight: '800' },
});
