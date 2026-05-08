import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Modal, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExpenseScreen() {
  const { isDarkMode } = useTheme();
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [expenseList, setExpenseList] = useState([
    { id: '1', title: 'Client Lunch', category: 'Food', date: '29 Apr', amount: '₹ 1,250', status: 'Pending', color: '#FF9800', receipt: true },
    { id: '2', title: 'Travel Allowance', category: 'Travel', date: '25 Apr', amount: '₹ 800', status: 'Approved', color: '#4CAF50', receipt: true },
    { id: '3', title: 'Office Supplies', category: 'Office', date: '20 Apr', amount: '₹ 450', status: 'Rejected', color: '#F44336', receipt: false },
  ]);
  const [totalClaimed, setTotalClaimed] = useState('₹ 2,500.00');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.minix.com';

        const response = await fetch(`${apiUrl}/employee/expenses`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.expenses) setExpenseList(data.expenses);
          if (data.total) setTotalClaimed(data.total);
        }
      } catch (e) {
        console.error('Failed to fetch expenses', e);
      }
    };
    fetchExpenses();
  }, []);

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

  const categories = [
    { label: 'Travel', amount: '₹ 800', icon: 'airplane.departure', color: '#4CAF50' },
    { label: 'Food', amount: '₹ 1,250', icon: 'cart.fill', color: '#FF9800' },
    { label: 'Office', amount: '₹ 450', icon: 'building.2.fill', color: '#2196F3' },
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
              <Text style={styles.headerTitle}>Expense Manager</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-expense')}>
                <IconSymbol name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
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
          <View style={[styles.summaryCard, { backgroundColor: C.primary }]}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>Total Claimed (April)</Text>
                <Text style={styles.summaryAmount}>{totalClaimed}</Text>
              </View>
              <View style={styles.premiumBadge}>
                <IconSymbol name="star.fill" size={12} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            </View>

            <View style={styles.categoryRow}>
              {categories.map((cat, i) => (
                <View key={i} style={styles.catItem}>
                  <View style={[styles.catIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <IconSymbol name={cat.icon as any} size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={styles.catAmount}>{cat.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Transactions</Text>
          <TouchableOpacity><Text style={styles.viewAll}>Filter</Text></TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {expenseList.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.expenseCard, { backgroundColor: C.card }]}>
              <View style={styles.expenseInfo}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                  <IconSymbol name={categories.find(c => c.label === item.category)?.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.expenseTitle, { color: C.text }]}>{item.title}</Text>
                  <Text style={[styles.expenseDate, { color: C.subText }]}>{item.date} · {item.category}</Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={[styles.expenseAmount, { color: C.text }]}>{item.amount}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.statusText, { color: item.color }]}>{item.status}</Text>
                  </View>
                </View>
              </View>

              {item.receipt && (
                <TouchableOpacity
                  style={[styles.cardFooter, { borderTopColor: C.gray100 }]}
                  onPress={() => setReceiptVisible(true)}
                >
                  <View style={styles.footerItem}>
                    <IconSymbol name="doc.fill" size={12} color={C.primary} />
                    <Text style={[styles.footerText, { color: C.primary }]}>Receipt Attached</Text>
                  </View>
                  <View style={styles.previewBtn}>
                    <Text style={styles.previewText}>View Receipt</Text>
                    <IconSymbol name="chevron.right" size={12} color={C.primary} />
                  </View>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-expense')}>
        <View style={styles.fabGradient}>
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>New Claim</Text>
        </View>
      </TouchableOpacity>

      {/* Receipt Modal */}
      <Modal visible={receiptVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={() => setReceiptVisible(false)} />
          <View style={[styles.receiptContainer, { backgroundColor: C.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Receipt Preview</Text>
              <TouchableOpacity onPress={() => setReceiptVisible(false)} style={styles.closeBtn}>
                <IconSymbol name="xmark" size={20} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.receiptFrame}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1554224155-1696413575b9?auto=format&fit=crop&q=80&w=1000' }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
              <View style={styles.paidStamp}>
                <Text style={styles.paidText}>PAID</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.downloadBtn}>
              <IconSymbol name="tray.and.arrow.down.fill" size={18} color="#FFFFFF" />
              <Text style={styles.downloadText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  content: { flex: 1 },
  summaryContainer: { paddingHorizontal: 20 },
  summaryCard: { borderRadius: 28, padding: 25, elevation: 12, shadowColor: '#4361EE', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 5 },
  summaryAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  premiumBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
  catItem: { alignItems: 'center', flex: 1 },
  catIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  catAmount: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  viewAll: { fontSize: 12, color: '#4361EE', fontWeight: '700' },
  listContainer: { paddingHorizontal: 20 },
  expenseCard: { borderRadius: 24, padding: 18, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  expenseInfo: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expenseTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  expenseDate: { fontSize: 12 },
  expenseRight: { alignItems: 'flex-end', gap: 5 },
  expenseAmount: { fontSize: 16, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 11, fontWeight: '700' },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewText: { fontSize: 11, fontWeight: '800', color: '#4361EE' },
  fab: { position: 'absolute', bottom: 30, right: 20, elevation: 8, shadowColor: '#4361EE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  fabGradient: { backgroundColor: '#4361EE', paddingHorizontal: 22, paddingVertical: 16, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fabText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  receiptContainer: { width: '100%', borderRadius: 30, padding: 20, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  receiptFrame: { width: '100%', height: 400, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', padding: 10 },
  receiptImage: { width: '100%', height: '100%' },
  paidStamp: { position: 'absolute', top: 40, right: 40, borderWidth: 3, borderColor: '#F44336', padding: 10, borderRadius: 10, transform: [{ rotate: '15deg' }] },
  paidText: { color: '#F44336', fontWeight: '900', fontSize: 24, letterSpacing: 2 },
  downloadBtn: { backgroundColor: '#4361EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 16, marginTop: 20 },
  downloadText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
