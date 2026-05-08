import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function EducationDetailsScreen() {
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

  const EDUCATION = [
    { degree: 'Master of Computer Applications', school: 'Gujarat University', year: '2021 - 2023', grade: '8.5 CGPA', type: 'Post Graduation' },
    { degree: 'Bachelor of Computer Applications', school: 'Silver Oak University', year: '2018 - 2021', grade: '8.2 CGPA', type: 'Graduation' },
    { degree: 'High Secondary School (Science)', school: 'Kendriya Vidyalaya', year: '2016 - 2018', grade: '85%', type: 'Schooling' },
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
              <Text style={styles.headerTitle}>Education History</Text>
              <TouchableOpacity style={styles.backBtn}>
                <IconSymbol name="plus" size={22} color="#FFFFFF" />
              </TouchableOpacity>
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
              <View style={styles.summaryIcon}>
                 <IconSymbol name="graduationcap.fill" size={32} color="#FFFFFF" />
              </View>
              <View>
                 <Text style={styles.summaryLabel}>Highest Qualification</Text>
                 <Text style={styles.summaryValue}>Master of Computer Apps</Text>
              </View>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Academic Qualifications</Text>
        </View>

        <View style={styles.listContainer}>
          {EDUCATION.map((edu, index) => (
            <View key={index} style={[styles.eduCard, { backgroundColor: C.card }]}>
              <View style={styles.eduTop}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#334155' : '#F0F3FF' }]}>
                  <IconSymbol name="graduationcap.fill" size={22} color={C.primary} />
                </View>
                <View style={styles.eduMain}>
                  <Text style={[styles.degree, { color: C.text }]}>{edu.degree}</Text>
                  <Text style={[styles.school, { color: C.subText }]}>{edu.school}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F8F9FA' }]}>
                   <Text style={[styles.typeText, { color: C.primary }]}>{edu.type.split(' ')[0]}</Text>
                </View>
              </View>
              
              <View style={[styles.divider, { backgroundColor: C.gray100 }]} />
              
              <View style={styles.eduFooter}>
                <View style={styles.metaItem}>
                  <IconSymbol name="calendar" size={14} color={C.subText} />
                  <Text style={[styles.metaText, { color: C.subText }]}>{edu.year}</Text>
                </View>
                <View style={styles.metaItem}>
                  <IconSymbol name="star.fill" size={14} color="#FFC107" />
                  <Text style={[styles.metaText, { color: C.subText }]}>{edu.grade}</Text>
                </View>
                <TouchableOpacity style={styles.viewBtn}>
                   <Text style={[styles.viewText, { color: C.primary }]}>Details</Text>
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
  summaryCard: { borderRadius: 24, padding: 25, elevation: 8, shadowColor: '#4361EE', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 20 },
  summaryIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  listContainer: { paddingHorizontal: 20 },
  eduCard: { borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  eduTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconContainer: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  eduMain: { flex: 1 },
  degree: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  school: { fontSize: 13, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '800' },
  divider: { height: 1, marginBottom: 15 },
  eduFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '700' },
  viewBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(67, 97, 238, 0.08)' },
  viewText: { fontSize: 12, fontWeight: '800' },
});
