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
      casual: { used: 12, total: 15 },
      sick: { used: 8, total: 10 },
      requests: [
         { type: 'Casual Leave', range: 'Apr 10 - Apr 11', days: '2 days', status: 'Approved', statusColor: '#4CAF50', bgColor: '#E8F5E9' },
         { type: 'Sick Leave', range: 'Apr 29 - Apr 30', days: '2 days', status: 'Pending', statusColor: '#FF9800', bgColor: '#FFF3E0' },
      ]
   });

   useFocusEffect(
      useCallback(() => {
         const fetchLeave = async () => {
            try {
               const token = await AsyncStorage.getItem('user_token');
               const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.minix.com';
               
               const response = await fetch(`${apiUrl}/leave/summary`, {
                  headers: {
                     'Authorization': token ? `Bearer ${token}` : '',
                     'Accept': 'application/json',
                  }
               });

               if (response.ok) {
                  const data = await response.json();
                  setLeaveData(prev => ({ ...prev, ...data }));
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
      success: '#2EC4B6',
      danger: '#E71D36',
      warning: '#FF9F1C',
      bg: isDarkMode ? '#0F172A' : '#F8F9FB',
      card: isDarkMode ? '#1E293B' : '#FFFFFF',
      text: isDarkMode ? '#F8F9FB' : '#212529',
      subText: isDarkMode ? '#94A3B8' : '#64748B',
      white: '#FFFFFF',
      dark: isDarkMode ? '#000000' : '#1B1B2F',
      gray50: isDarkMode ? '#334155' : '#F8F9FA',
      gray100: isDarkMode ? '#334155' : '#F1F3F5',
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
                  <Text style={styles.summaryLabel}>Casual Leave</Text>
                  <Text style={styles.summaryValue}>{leaveData.casual.used} / {leaveData.casual.total}</Text>
                  <Text style={styles.summarySub}>Days Remaining</Text>
               </View>
               <View style={[styles.summaryCard, { backgroundColor: '#FF9800' }]}>
                  <Text style={styles.summaryLabel}>Sick Leave</Text>
                  <Text style={styles.summaryValue}>{leaveData.sick.used} / {leaveData.sick.total}</Text>
                  <Text style={styles.summarySub}>Days Remaining</Text>
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
               {leaveData.requests.map((item, i) => (
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
                        <TouchableOpacity>
                           <Text style={[styles.detailsText, { color: C.primary }]}>View Details</Text>
                        </TouchableOpacity>
                     </View>
                  </View>
               ))}
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
   summaryGrid: { flexDirection: 'row', gap: 15, paddingHorizontal: 20 },
   summaryCard: { flex: 1, borderRadius: 24, padding: 18, elevation: 5 },
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
