import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function LeaveHistoryScreen() {
  const { isDarkMode } = useTheme();

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

  const ALL_REQUESTS = [
    { id: '1', type: 'Casual Leave', range: 'Apr 28 - Apr 29', days: '2 days', status: 'Approved', color: C.success, date: 'Applied on 20 Apr' },
    { id: '2', type: 'Sick Leave', range: 'May 02 - May 02', days: '1 day', status: 'Pending', color: C.warning, date: 'Applied on 01 May' },
    { id: '3', type: 'Compensatory Off', range: 'May 03 - May 03', days: '1 day', status: 'Pending', color: C.warning, date: 'Applied on 01 May' },
    { id: '4', type: 'Earned Leave', range: 'Apr 25 - Apr 26', days: '2 days', status: 'Rejected', color: C.danger, date: 'Applied on 20 Apr' },
    { id: '5', type: 'Casual Leave', range: 'Apr 10 - Apr 12', days: '3 days', status: 'Approved', color: C.success, date: 'Applied on 05 Apr' },
    { id: '6', type: 'Sick Leave', range: 'Mar 28 - Mar 28', days: '1 day', status: 'Approved', color: C.success, date: 'Applied on 25 Mar' },
    { id: '7', type: 'Earned Leave', range: 'Mar 15 - Mar 17', days: '3 days', status: 'Approved', color: C.success, date: 'Applied on 10 Mar' },
  ];

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
              <TouchableOpacity style={styles.filterBtn}>
                <IconSymbol name="list.bullet.indent" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>

      <FlatList
        data={ALL_REQUESTS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 50 }}
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
