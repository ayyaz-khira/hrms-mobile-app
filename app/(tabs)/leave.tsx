import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function LeaveTrackerScreen() {
   const { isDarkMode } = useTheme();
   const [leaveData, setLeaveData] = useState({
      casual: { used: 2, total: 12 },
      sick: { used: 1, total: 8 },
      privilege: { used: 5, total: 15 },
      compOff: { used: 0, total: 4 },
      requests: []
   });

  useFocusEffect(
    useCallback(() => {
      const fetchLeave = async () => {
        try {
          const token = await AsyncStorage.getItem('user_token');
          const userId = await AsyncStorage.getItem('user_id');

          if (!token || !userId) return;

          const rawToken = token.trim();
          let authHeader = rawToken;
          if (!rawToken.toLowerCase().startsWith('token ') && !rawToken.toLowerCase().startsWith('bearer ')) {
            authHeader = rawToken.includes(':') ? `token ${rawToken}` : rawToken;
          }

          const commonHeaders = {
            'Authorization': authHeader,
            'sid': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          };

          // 1. Fetch Leave Balance (via employee details)
          const detailsResponse = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_details', {
        credentials: 'include',
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({ employee: userId.trim() })
          });

          if (detailsResponse.ok) {
            const detailsResult = await detailsResponse.json();
            const details = detailsResult.message;
            if (details && details.leave_details) {
              setLeaveData(prev => ({ 
                ...prev, 
                casual: details.leave_details.casual || prev.casual,
                sick: details.leave_details.sick || prev.sick,
                privilege: details.leave_details.privilege || prev.privilege,
                compOff: details.leave_details.compensatory_off || prev.compOff
              }));
            }
          }

          // 2. Fetch Leave Applications (Requests List)
          const requestsResponse = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_leave_applications', {
        credentials: 'include',
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({ employee: userId.trim() })
          });

          if (requestsResponse.ok) {
            const requestsResult = await requestsResponse.json();
            const message = requestsResult.message;
            console.log("📥 Leave Data Received:", JSON.stringify(message).substring(0, 100) + "...");
            
            // The logs show data is inside message.data
            const logs = message?.data || (Array.isArray(message) ? message : []);
            console.log("📥 Leave Requests Count:", logs.length);
            
            if (Array.isArray(logs)) {
               const mapped = logs.map((l: any) => ({
                  type: l.leave_type || 'Leave Request',
                  range: `${l.from_date} - ${l.to_date}`,
                  days: `${l.total_leave_days} days`,
                  status: l.status || 'Pending',
                  statusColor: l.status === 'Approved' ? '#4CAF50' : (l.status === 'Rejected' ? '#F44336' : '#FF9800'),
                  bgColor: l.status === 'Approved' ? '#E8F5E9' : (l.status === 'Rejected' ? '#FFEBEE' : '#FFF3E0')
               }));
               // Show last 3 in Active Requests
               setLeaveData(prev => ({ ...prev, requests: mapped.slice(0, 3) }));
            }
          }
        } catch (e) {
          console.error('Failed to fetch leave data', e);
        }
      };

      fetchLeave();
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
   return (
      <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
         <StatusBar barStyle="light-content" backgroundColor={C.dark} />

         {/* Fixed Header */}
         <View style={styles.headerContainer}>
            <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
               <SafeAreaView edges={['top']}>
                  <View style={styles.headerRow}>
                     <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
               <View style={[styles.summaryCard, { backgroundColor: '#4361EE' }]}>
                  <Text style={styles.summaryLabel}>Casual</Text>
                  <Text style={styles.summaryValue}>{leaveData.casual.used}/{leaveData.casual.total}</Text>
                  <Text style={styles.summarySub}>Remaining</Text>
               </View>
               <View style={[styles.summaryCard, { backgroundColor: '#FF9800' }]}>
                  <Text style={styles.summaryLabel}>Sick</Text>
                  <Text style={styles.summaryValue}>{leaveData.sick.used}/{leaveData.sick.total}</Text>
                  <Text style={styles.summarySub}>Remaining</Text>
               </View>
               <View style={[styles.summaryCard, { backgroundColor: '#2EC4B6' }]}>
                  <Text style={styles.summaryLabel}>Privilege</Text>
                  <Text style={styles.summaryValue}>{leaveData.privilege.used}/{leaveData.privilege.total}</Text>
                  <Text style={styles.summarySub}>Remaining</Text>
               </View>
               <View style={[styles.summaryCard, { backgroundColor: '#E71D36' }]}>
                  <Text style={styles.summaryLabel}>Comp Off</Text>
                  <Text style={styles.summaryValue}>{leaveData.compOff.used}/{leaveData.compOff.total}</Text>
                  <Text style={styles.summarySub}>Remaining</Text>
               </View>
            </View>

            <View style={styles.actionRow}>
               <TouchableOpacity style={[styles.mainAction, { backgroundColor: C.primary }]} onPress={() => router.push('/apply-leave')}>
                  <IconSymbol name="plus" size={24} color="#FFFFFF" />
                  <Text style={styles.mainActionText}>Apply New Leave</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.sideAction, { backgroundColor: C.card }]} onPress={() => router.push('/leave-history')}>
                  <IconSymbol name="list.bullet.indent" size={20} color={C.primary} />
               </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: C.text }]}>Active Requests</Text>
            </View>

            <View style={styles.requestList}>
               {leaveData.requests.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: C.card }]}>
                     <IconSymbol name="calendar.badge.exclamationmark" size={32} color={C.gray100} />
                     <Text style={[styles.emptyText, { color: C.subText }]}>No active leave requests</Text>
                  </View>
               ) : (
                  leaveData.requests.map((item, i) => (
                     <View key={i} style={[styles.requestCard, { backgroundColor: C.card }]}>
                     <View style={styles.requestTop}>
                        <View>
                           <Text style={[styles.requestType, { color: C.text }]}>{item.type}</Text>
                           <Text style={[styles.requestRange, { color: C.subText }]}>{item.range}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: item.statusColor + '15' }]}>
                           <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
                        </View>
                     </View>
                     <View style={[styles.divider, { backgroundColor: C.gray100 }]} />
                     <View style={styles.requestBottom}>
                        <View style={styles.metaItem}>
                           <IconSymbol name="clock.fill" size={14} color={C.subText} />
                           <Text style={[styles.metaText, { color: C.subText }]}>{item.days}</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/leave-history')}>
                           <Text style={[styles.detailsText, { color: C.primary }]}>View Details</Text>
                        </TouchableOpacity>
                     </View>
                  </View>
               ))
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
   mainAction: { flex: 1, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4 },
   mainActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
   sideAction: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 2 },
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
