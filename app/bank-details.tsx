import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function BankDetailsScreen() {
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
              <Text style={styles.headerTitle}>Bank & Statutory</Text>
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
           <View style={[styles.bankCard, { backgroundColor: '#1B1B2F' }]}>
              <View style={styles.cardHeader}>
                 <Text style={styles.bankName}>HDFC BANK LTD</Text>
                 <IconSymbol name="creditcard.fill" size={24} color="rgba(255,255,255,0.4)" />
              </View>
              <View style={styles.accountNumberContainer}>
                 <Text style={styles.accountNumber}>XXXX XXXX 8595</Text>
              </View>
              <View style={styles.cardFooter}>
                 <View>
                    <Text style={styles.cardLabel}>HOLDER NAME</Text>
                    <Text style={styles.cardValue}>HARSH RAJPUT</Text>
                 </View>
                 <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.cardLabel}>IFSC CODE</Text>
                    <Text style={styles.cardValue}>HDFC0001234</Text>
                 </View>
              </View>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Statutory Information</Text>
        </View>

        <View style={styles.listContainer}>
           <View style={[styles.statCard, { backgroundColor: C.card }]}>
              <View style={styles.statItem}>
                 <View style={styles.statLeft}>
                    <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                       <IconSymbol name="doc.text.fill" size={18} color="#2196F3" />
                    </View>
                    <View>
                       <Text style={[styles.statLabelText, { color: C.subText }]}>PAN NUMBER</Text>
                       <Text style={[styles.statValueText, { color: C.text }]}>ABCDE1234F</Text>
                    </View>
                 </View>
                 <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
              </View>
              
              <View style={[styles.divider, { backgroundColor: C.gray100 }]} />
              
              <View style={styles.statItem}>
                 <View style={styles.statLeft}>
                    <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                       <IconSymbol name="person.fill" size={18} color="#4CAF50" />
                    </View>
                    <View>
                       <Text style={[styles.statLabelText, { color: C.subText }]}>AADHAAR NUMBER</Text>
                       <Text style={[styles.statValueText, { color: C.text }]}>1234 5678 9012</Text>
                    </View>
                 </View>
                 <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
              </View>

              <View style={[styles.divider, { backgroundColor: C.gray100 }]} />

              <View style={styles.statItem}>
                 <View style={styles.statLeft}>
                    <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                       <IconSymbol name="building.fill" size={18} color="#FF9800" />
                    </View>
                    <View>
                       <Text style={[styles.statLabelText, { color: C.subText }]}>UAN NUMBER</Text>
                       <Text style={[styles.statValueText, { color: C.text }]}>100200300400</Text>
                    </View>
                 </View>
                 <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
              </View>
           </View>
        </View>

        <TouchableOpacity style={styles.updateBtn}>
           <Text style={styles.updateBtnText}>Request Information Update</Text>
        </TouchableOpacity>
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
  bankCard: { borderRadius: 28, padding: 25, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  bankName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  accountNumberContainer: { marginBottom: 30 },
  accountNumber: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', letterSpacing: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  cardValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  listContainer: { paddingHorizontal: 20 },
  statCard: { borderRadius: 24, paddingHorizontal: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabelText: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  statValueText: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1 },
  updateBtn: { marginHorizontal: 20, marginTop: 30, backgroundColor: '#4361EE', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  updateBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
