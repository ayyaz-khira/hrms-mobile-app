import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function HolidaysScreen() {
  const { isDarkMode } = useTheme();

  const C = {
    primary: '#4361EE',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    gray50: isDarkMode ? '#334155' : '#F8F9FA',
    gray100: isDarkMode ? '#334155' : '#F1F3F5',
  };

  const holidays = [
    { name: 'Independence Day', date: '15 Aug 2026', day: 'Saturday', type: 'Public Holiday', icon: 'star.fill', color: '#FF9800' },
    { name: 'Raksha Bandhan', date: '28 Aug 2026', day: 'Friday', type: 'Optional', icon: 'heart.fill', color: '#E91E63' },
    { name: 'Janmashtami', date: '04 Sep 2026', day: 'Friday', type: 'Public Holiday', icon: 'sun.max.fill', color: '#FFC107' },
    { name: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', type: 'Public Holiday', icon: 'person.fill', color: '#4CAF50' },
    { name: 'Dussehra', date: '21 Oct 2026', day: 'Wednesday', type: 'Public Holiday', icon: 'sun.max.fill', color: '#F44336' },
    { name: 'Diwali', date: '01 Nov 2026', day: 'Sunday', type: 'Public Holiday', icon: 'sun.max.fill', color: '#FF9800' },
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
              <Text style={styles.headerTitle}>Holidays 2026</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 50 }}
      >
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: C.primary }]}>
             <View>
                <Text style={styles.summaryLabel}>Holidays Left</Text>
                <Text style={styles.summaryAmount}>08 Days</Text>
             </View>
             <View style={styles.summaryDivider} />
             <View>
                <Text style={styles.summaryLabel}>Next Break</Text>
                <Text style={styles.nextDate}>15 Aug</Text>
             </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Upcoming Festivities</Text>
        </View>

        <View style={styles.listContainer}>
          {holidays.map((item, i) => (
            <View key={i} style={[styles.holidayCard, { backgroundColor: C.card }]}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <IconSymbol name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.holidayInfo}>
                <Text style={[styles.holidayName, { color: C.text }]}>{item.name}</Text>
                <View style={styles.typeRow}>
                   <Text style={[styles.holidayDay, { color: C.subText }]}>{item.day}</Text>
                   <View style={styles.dot} />
                   <Text style={[styles.typeText, { color: item.type === 'Optional' ? C.primary : '#64748B' }]}>{item.type}</Text>
                </View>
              </View>
              <View style={[styles.dateBox, { borderLeftColor: C.gray100 }]}>
                 <Text style={[styles.dateNum, { color: C.text }]}>{item.date.split(' ')[0]}</Text>
                 <Text style={styles.dateMonth}>{item.date.split(' ')[1]}</Text>
              </View>
            </View>
          ))}
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
  summaryContainer: { paddingHorizontal: 20 },
  summaryCard: { borderRadius: 24, padding: 25, elevation: 8, shadowColor: '#4361EE', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  summaryAmount: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  nextDate: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  listContainer: { paddingHorizontal: 20 },
  holidayCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  holidayInfo: { flex: 1 },
  holidayName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  typeRow: { flexDirection: 'row', alignItems: 'center' },
  holidayDay: { fontSize: 12, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginHorizontal: 8 },
  typeText: { fontSize: 11, fontWeight: '700' },
  dateBox: { width: 50, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, marginLeft: 10 },
  dateNum: { fontSize: 18, fontWeight: '900' },
  dateMonth: { fontSize: 10, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' },
});
