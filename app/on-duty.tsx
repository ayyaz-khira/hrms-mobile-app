import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function OnDutyScreen() {
  const { isDarkMode } = useTheme();
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');

  const C = {
    primary: '#4361EE',
    primaryLight: '#EEF2FF',
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
              <Text style={styles.headerTitle}>Apply Field Duty (OD)</Text>
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
            <View style={[styles.sectionIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#E3F2FD' }]}>
              <IconSymbol name="location.fill" size={16} color="#2196F3" />
            </View>
            <Text style={[styles.sectionLabel, { color: C.text }]}>Duty Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Work Location</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
              <TextInput
                style={[styles.textInput, { color: C.text }]}
                placeholder="e.g. Client Office, Site visit"
                placeholderTextColor={C.subText}
                value={location}
                onChangeText={setLocation}
              />
              <IconSymbol name="location.fill" size={16} color={C.subText} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Remarks</Text>
            <View style={[styles.textAreaContainer, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
              <TextInput
                style={[styles.textArea, { color: C.text }]}
                placeholder="Describe your planned activities..."
                placeholderTextColor={C.subText}
                multiline
                numberOfLines={4}
                value={remarks}
                onChangeText={setRemarks}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.noticeBox, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF9C4' }]}>
            <IconSymbol name="bell.fill" size={18} color="#FBC02D" />
            <Text style={[styles.noticeText, { color: isDarkMode ? '#FBC02D' : '#827717' }]}>
              On Duty requests are subject to manager approval.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: C.card, borderTopColor: C.gray100 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={() => router.back()}>
          <Text style={styles.applyBtnText}>Mark On Duty</Text>
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
  textInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  textAreaContainer: { borderRadius: 16, padding: 15, borderWidth: 1, minHeight: 120 },
  textArea: { fontSize: 14, textAlignVertical: 'top' },
  divider: { height: 1, backgroundColor: '#F1F3F5', marginVertical: 10 },
  noticeBox: { flexDirection: 'row', gap: 10, padding: 15, borderRadius: 16, alignItems: 'center' },
  noticeText: { fontSize: 12, flex: 1, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 25, gap: 12, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F3F5' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  applyBtn: { flex: 2, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B1B2F' },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
