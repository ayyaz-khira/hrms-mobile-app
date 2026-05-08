import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function SalarySlipScreen() {
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

  const slips = [
    { month: 'April 2026', amount: '₹ 85,000', date: '01 May 2026', id: 'SLP-2026-04' },
    { month: 'March 2026', amount: '₹ 85,000', date: '01 Apr 2026', id: 'SLP-2026-03' },
    { month: 'February 2026', amount: '₹ 82,500', date: '01 Mar 2026', id: 'SLP-2026-02' },
    { month: 'January 2026', amount: '₹ 82,500', date: '01 Feb 2026', id: 'SLP-2026-01' },
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
              <Text style={styles.headerTitle}>Salary Slips</Text>
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
             <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>Annual Earnings (FY 26-27)</Text>
                <Text style={styles.summaryAmount}>₹ 3,35,000.00</Text>
             </View>
             <View style={styles.summaryBadge}>
                <IconSymbol name="banknote.fill" size={16} color="#FFFFFF" />
                <Text style={styles.summaryBadgeText}>Tax Saving: 12%</Text>
             </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>E-Slips History</Text>
        </View>

        <View style={styles.listContainer}>
          {slips.map((item, i) => (
            <View key={i} style={[styles.slipCard, { backgroundColor: C.card }]}>
              <View style={styles.slipMain}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#334155' : '#F0F3FF' }]}>
                  <IconSymbol name="doc.fill" size={20} color={C.primary} />
                </View>
                <View style={styles.slipInfo}>
                  <Text style={[styles.slipMonth, { color: C.text }]}>{item.month}</Text>
                  <Text style={[styles.slipId, { color: C.subText }]}>{item.id}</Text>
                </View>
              </View>
              
              <View style={[styles.slipDivider, { backgroundColor: C.gray100 }]} />
              
              <View style={styles.slipFooter}>
                <View>
                  <Text style={[styles.amountLabel, { color: C.subText }]}>Net Payable</Text>
                  <Text style={[styles.amountValue, { color: C.text }]}>{item.amount}</Text>
                </View>
                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: C.dark }]}>
                  <IconSymbol name="tray.and.arrow.down.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadText}>PDF</Text>
                </TouchableOpacity>
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
  summaryCard: { borderRadius: 24, padding: 25, elevation: 8, shadowColor: '#4361EE', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryInfo: { flex: 1 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 5 },
  summaryAmount: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  summaryBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center', gap: 4 },
  summaryBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  listContainer: { paddingHorizontal: 20 },
  slipCard: { borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 15 },
  slipMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  slipInfo: { flex: 1 },
  slipMonth: { fontSize: 16, fontWeight: '800' },
  slipId: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  slipDivider: { height: 1, marginBottom: 15 },
  slipFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  amountValue: { fontSize: 18, fontWeight: '900' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, gap: 8 },
  downloadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
