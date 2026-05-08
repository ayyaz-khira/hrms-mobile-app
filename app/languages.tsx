import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function LanguagesScreen() {
  const { isDarkMode } = useTheme();
  const [selected, setSelected] = useState('English (US)');

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

  const LANGUAGES = [
    { name: 'English (US)', code: 'EN', flag: '🇺🇸' },
    { name: 'Hindi (India)', code: 'HI', flag: '🇮🇳' },
    { name: 'Gujarati (India)', code: 'GU', flag: '🇮🇳' },
    { name: 'Spanish (Spain)', code: 'ES', flag: '🇪🇸' },
    { name: 'French (France)', code: 'FR', flag: '🇫🇷' },
    { name: 'German (Germany)', code: 'DE', flag: '🇩🇪' },
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
              <Text style={styles.headerTitle}>Languages</Text>
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
        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Choose Language</Text>
        </View>

        <View style={[styles.card, { backgroundColor: C.card }]}>
           {LANGUAGES.map((lang, i) => (
             <React.Fragment key={lang.code}>
                <TouchableOpacity 
                   style={styles.langRow} 
                   onPress={() => setSelected(lang.name)}
                >
                   <View style={styles.langLeft}>
                      <View style={[styles.flagContainer, { backgroundColor: isDarkMode ? '#334155' : '#F8F9FA' }]}>
                         <Text style={styles.flagText}>{lang.flag}</Text>
                      </View>
                      <Text style={[styles.langName, { color: C.text }]}>{lang.name}</Text>
                   </View>
                   {selected === lang.name && (
                      <IconSymbol name="checkmark.circle.fill" size={22} color={C.primary} />
                   )}
                </TouchableOpacity>
                {i < LANGUAGES.length - 1 && <View style={[styles.divider, { backgroundColor: C.gray100 }]} />}
             </React.Fragment>
           ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
           <Text style={styles.saveBtnText}>Save Language</Text>
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
  sectionHeader: { paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  card: { marginHorizontal: 20, borderRadius: 24, padding: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  flagContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flagText: { fontSize: 20 },
  langName: { fontSize: 15, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 15 },
  saveBtn: { marginHorizontal: 20, marginTop: 30, backgroundColor: '#4361EE', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
