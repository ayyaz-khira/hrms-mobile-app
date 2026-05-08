import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function LoanScreen() {
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
              <Text style={styles.headerTitle}>Loan & Advances</Text>
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
        <View style={styles.summaryContainer}>
          <View style={[styles.premiumCard, { backgroundColor: '#1B1B2F' }]}>
            <View style={styles.cardPattern} />
            <View style={styles.cardHeader}>
              <View>
                 <Text style={styles.cardLabel}>Remaining Balance</Text>
                 <Text style={styles.loanAmount}>₹ 45,000.00</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE LOAN</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
               <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '40%' }]} />
               </View>
               <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Paid: ₹ 30,000</Text>
                  <Text style={styles.progressLabel}>Tenure: 12 Months</Text>
               </View>
            </View>
            
            <View style={styles.cardFooter}>
               <View>
                  <Text style={styles.footerLabel}>Next EMI Date</Text>
                  <Text style={styles.footerValue}>01 June 2026</Text>
               </View>
               <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.footerLabel}>EMI Amount</Text>
                  <Text style={styles.footerValue}>₹ 5,000</Text>
               </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Apply for Advance</Text>
        </View>

        <View style={styles.actionGrid}>
           <TouchableOpacity style={[styles.actionCard, { backgroundColor: C.card }]}>
              <View style={[styles.actionIconBg, { backgroundColor: '#E3F2FD' }]}>
                 <IconSymbol name="plus" size={22} color="#2196F3" />
              </View>
              <Text style={[styles.actionText, { color: C.text }]}>Personal Loan</Text>
              <Text style={styles.actionSub}>Upto ₹ 2 Lakhs</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.actionCard, { backgroundColor: C.card }]}>
              <View style={[styles.actionIconBg, { backgroundColor: '#E8F5E9' }]}>
                 <IconSymbol name="banknote.fill" size={22} color="#4CAF50" />
              </View>
              <Text style={[styles.actionText, { color: C.text }]}>Salary Advance</Text>
              <Text style={styles.actionSub}>Upto 50% Salary</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Transactions</Text>
        </View>

        <View style={styles.historyList}>
           {[
             { date: '01 May 2026', amount: '₹ 5,000', type: 'EMI Deduction', status: 'Paid', color: '#4CAF50' },
             { date: '01 Apr 2026', amount: '₹ 5,000', type: 'EMI Deduction', status: 'Paid', color: '#4CAF50' },
             { date: '01 Mar 2026', amount: '₹ 75,000', type: 'Loan Disbursed', status: 'Credited', color: '#2196F3' },
           ].map((item, i) => (
             <View key={i} style={[styles.historyItem, { backgroundColor: C.card }]}>
                <View style={styles.historyLeft}>
                   <View style={[styles.historyIcon, { backgroundColor: item.color + '15' }]}>
                      <IconSymbol name={item.type.includes('Deduction') ? 'arrow.down.right' : 'arrow.up.right'} size={16} color={item.color} />
                   </View>
                   <View>
                      <Text style={[styles.historyTitle, { color: C.text }]}>{item.type}</Text>
                      <Text style={[styles.historyDate, { color: C.subText }]}>{item.date}</Text>
                   </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                   <Text style={[styles.historyAmount, { color: C.text }]}>{item.amount}</Text>
                   <Text style={[styles.historyStatus, { color: item.color }]}>{item.status}</Text>
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
  premiumCard: { borderRadius: 30, padding: 25, elevation: 15, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, overflow: 'hidden' },
  cardPattern: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.03)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  activeBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  activeBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  loanAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  progressContainer: { marginBottom: 25 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: '#4361EE' },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
  footerLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  footerValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  actionGrid: { flexDirection: 'row', gap: 15, paddingHorizontal: 20 },
  actionCard: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  actionIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionText: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  actionSub: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  historyList: { paddingHorizontal: 20 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 24, marginBottom: 15, elevation: 1 },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  historyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 14, fontWeight: '800' },
  historyDate: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  historyAmount: { fontSize: 16, fontWeight: '900', marginBottom: 2 },
  historyStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
});
