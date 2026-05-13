import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function AppearanceScreen() {
  const { isDarkMode, toggleTheme } = useTheme();

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
              <Text style={styles.headerTitle}>Appearance</Text>
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
           <Text style={[styles.sectionTitle, { color: C.text }]}>Theme Settings</Text>
        </View>

        <View style={[styles.card, { backgroundColor: C.card }]}>
           <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                 <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#334155' : '#EEF2FF' }]}>
                    <IconSymbol name={isDarkMode ? "moon.fill" : "sun.max.fill"} size={22} color={C.primary} />
                 </View>
                 <View>
                    <Text style={[styles.settingLabel, { color: C.text }]}>Dark Mode</Text>
                    <Text style={[styles.settingSub, { color: C.subText }]}>{isDarkMode ? 'Dark theme is active' : 'Light theme is active'}</Text>
                 </View>
              </View>
              <Switch 
                 value={isDarkMode} 
                 onValueChange={toggleTheme}
                 trackColor={{ false: '#CBD5E1', true: C.primary }}
                 thumbColor="#FFFFFF"
              />
           </View>
        </View>


        <View style={styles.infoBox}>
           <IconSymbol name="info.circle" size={16} color={C.subText} />
           <Text style={[styles.infoText, { color: C.subText }]}>
              Customizing your appearance helps reduce eye strain and saves battery on OLED screens.
           </Text>
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
  sectionHeader: { paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  card: { marginHorizontal: 20, borderRadius: 24, padding: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '700' },
  settingSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  infoBox: { flexDirection: 'row', gap: 10, marginHorizontal: 30, marginTop: 30, alignItems: 'flex-start' },
  infoText: { fontSize: 12, lineHeight: 18, flex: 1, fontWeight: '500' }
});
