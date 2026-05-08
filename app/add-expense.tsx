import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = [
  { label: 'Travel', icon: 'airplane.departure', color: '#4CAF50' },
  { label: 'Food & Dining', icon: 'cart.fill', color: '#FF9800' },
  { label: 'Office Supplies', icon: 'building.2.fill', color: '#2196F3' },
  { label: 'Other', icon: 'doc.fill', color: '#9C27B0' },
];

export default function AddExpenseScreen() {
  const { isDarkMode } = useTheme();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Travel');
  const [description, setDescription] = useState('');

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
              <Text style={styles.headerTitle}>New Expense Claim</Text>
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
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: C.primary + '15' }]}>
              <IconSymbol name="banknote.fill" size={16} color={C.primary} />
            </View>
            <Text style={[styles.sectionLabel, { color: C.text }]}>Claim Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Expense Title</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
              <TextInput
                style={[styles.textInput, { color: C.text }]}
                placeholder="e.g. Client Meeting Lunch"
                placeholderTextColor={C.subText}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: C.text }]}>Amount</Text>
              <View style={[styles.inputWrapper, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
                <Text style={[styles.currency, { color: C.subText }]}>₹</Text>
                <TextInput
                  style={[styles.textInput, { color: C.text }]}
                  placeholder="0.00"
                  placeholderTextColor={C.subText}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: C.text }]}>Date</Text>
              <TouchableOpacity style={[styles.inputWrapper, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
                <Text style={[styles.dateValue, { color: C.text }]}>05 May 2026</Text>
                <IconSymbol name="calendar" size={16} color={C.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.label}
                  style={[
                    styles.catChip, 
                    { backgroundColor: C.gray50, borderColor: category === cat.label ? C.primary : C.gray100 }
                  ]}
                  onPress={() => setCategory(cat.label)}
                >
                  <IconSymbol name={cat.icon as any} size={14} color={category === cat.label ? C.primary : C.subText} />
                  <Text style={[styles.catLabelText, { color: category === cat.label ? C.primary : C.text }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Description (Optional)</Text>
            <View style={[styles.textAreaContainer, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
              <TextInput
                style={[styles.textArea, { color: C.text }]}
                placeholder="Describe the expense..."
                placeholderTextColor={C.subText}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F0F3FF' }]}>
              <IconSymbol name="doc.fill" size={16} color={C.primary} />
            </View>
            <Text style={[styles.sectionLabel, { color: C.text }]}>Attachments</Text>
          </View>

          <TouchableOpacity style={[styles.uploadBox, { backgroundColor: C.gray50, borderStyle: 'dashed', borderColor: C.primary }]}>
             <IconSymbol name="plus" size={24} color={C.primary} />
             <Text style={[styles.uploadText, { color: C.primary }]}>Upload Receipt / Bill</Text>
             <Text style={[styles.uploadSub, { color: C.subText }]}>Maximum size: 5MB (PNG, JPG, PDF)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: C.card, borderTopColor: C.gray100 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={() => router.back()}>
          <Text style={styles.applyBtnText}>Submit Claim</Text>
        </TouchableOpacity>
      </View>
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
  card: { marginHorizontal: 20, borderRadius: 24, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '700' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 15, height: 54, borderWidth: 1 },
  currency: { fontSize: 16, fontWeight: '700', marginRight: 8 },
  textInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  dateValue: { flex: 1, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  catLabelText: { fontSize: 12, fontWeight: '700' },
  textAreaContainer: { borderRadius: 16, padding: 15, borderWidth: 1, minHeight: 80 },
  textArea: { fontSize: 14, textAlignVertical: 'top' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 15 },
  uploadBox: { borderRadius: 20, borderWidth: 1, padding: 30, alignItems: 'center', justifyContent: 'center', gap: 10 },
  uploadText: { fontSize: 15, fontWeight: '700' },
  uploadSub: { fontSize: 11, fontWeight: '500' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 25, gap: 12, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F3F5' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  applyBtn: { flex: 2, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B1B2F' },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
