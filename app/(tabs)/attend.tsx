import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function AttendanceDetailsScreen() {
  const { isDarkMode } = useTheme();
  const [selectedDay, setSelectedDay] = useState(29);
  const [stats, setStats] = useState({ present: 22, absent: 2, late: 1 });
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchAttendance = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem('user_token');
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.minix.com';
          
          const response = await fetch(`${apiUrl}/attendance/logs`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Accept': 'application/json',
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.stats) setStats(data.stats);
          }
        } catch (e) {
          console.error('Failed to fetch attendance', e);
        } finally {
          setLoading(false);
        }
      };
      fetchAttendance();
    }, [])
  );

  const C = {
    primary: '#4361EE',
    success: '#4CAF50',
    danger: '#F44336',
    warning: '#FF9800',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    gray50: isDarkMode ? '#334155' : '#F8F9FA',
    gray100: isDarkMode ? '#334155' : '#F1F3F5',
  };

  const weekDays = [
    { name: 'Mon', date: 27, status: 'present' },
    { name: 'Tue', date: 28, status: 'present' },
    { name: 'Wed', date: 29, status: 'selected' },
    { name: 'Thu', date: 30, status: 'none' },
    { name: 'Fri', date: 1, status: 'none' },
    { name: 'Sat', date: 2, status: 'none' },
    { name: 'Sun', date: 3, status: 'none' },
  ];

  const teamData = [
    { name: 'Virendrakumar C.', time: '3h ago', status: 'Active', statusColor: '#4CAF50' },
    { name: 'Parth D. Panchal.', time: '3h ago', status: 'Active', statusColor: '#4CAF50' },
    { name: 'Kishan S. Rathod.', time: '4h ago', status: 'On Break', statusColor: '#FF9800' },
  ];

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />
      
      {/* Header with Background Fill */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <IconSymbol name="arrow.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Attendance Tracker</Text>
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
        <View style={styles.monthHeader}>
           <TouchableOpacity style={[styles.monthSelector, { backgroundColor: C.card }]}>
              <IconSymbol name="calendar" size={16} color={C.primary} />
              <Text style={[styles.monthText, { color: C.text }]}>April 2026</Text>
              <IconSymbol name="chevron.down" size={14} color={C.subText} />
           </TouchableOpacity>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: C.card }]}>
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={[styles.weekDayName, { color: C.subText }]}>{day.name}</Text>
                <TouchableOpacity 
                  style={[
                    styles.dateCircle,
                    day.status === 'present' && { backgroundColor: C.success + '20' },
                    day.status === 'selected' && { backgroundColor: C.primary },
                  ]}
                  onPress={() => setSelectedDay(day.date)}
                >
                  <Text style={[
                    styles.dateText,
                    { color: day.status === 'selected' ? '#FFFFFF' : day.status === 'present' ? C.success : C.text }
                  ]}>{day.date}</Text>
                </TouchableOpacity>
                {day.status === 'present' && <View style={[styles.presentDot, { backgroundColor: C.success }]} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsGrid}>
           <View style={[styles.statItem, { backgroundColor: C.card }]}>
              <View style={[styles.statIcon, { backgroundColor: C.success + '15' }]}>
                 <IconSymbol name="checkmark.circle.fill" size={18} color={C.success} />
              </View>
              <Text style={[styles.statNum, { color: C.text }]}>{stats.present}</Text>
              <Text style={[styles.statLab, { color: C.subText }]}>PRESENT</Text>
           </View>
           <View style={[styles.statItem, { backgroundColor: C.card }]}>
              <View style={[styles.statIcon, { backgroundColor: C.danger + '15' }]}>
                 <IconSymbol name="xmark.circle.fill" size={18} color={C.danger} />
              </View>
              <Text style={[styles.statNum, { color: C.text }]}>{stats.absent}</Text>
              <Text style={[styles.statLab, { color: C.subText }]}>ABSENT</Text>
           </View>
           <View style={[styles.statItem, { backgroundColor: C.card }]}>
              <View style={[styles.statIcon, { backgroundColor: C.warning + '15' }]}>
                 <IconSymbol name="clock.fill" size={18} color={C.warning} />
              </View>
              <Text style={[styles.statNum, { color: C.text }]}>{stats.late}</Text>
              <Text style={[styles.statLab, { color: C.subText }]}>LATE</Text>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Day Details - April {selectedDay}</Text>
        </View>

        <View style={[styles.detailCard, { backgroundColor: C.card }]}>
           <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                 <View style={[styles.detailIcon, { backgroundColor: C.primary + '10' }]}>
                    <IconSymbol name="arrow.down.left.circle.fill" size={18} color={C.primary} />
                 </View>
                 <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: C.subText }]}>IN</Text>
                    <Text style={[styles.detailValue, { color: C.text }]}>09:15 AM</Text>
                 </View>
              </View>
              <View style={styles.detailItem}>
                 <View style={[styles.detailIcon, { backgroundColor: C.danger + '10' }]}>
                    <IconSymbol name="arrow.up.right.circle.fill" size={18} color={C.danger} />
                 </View>
                 <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: C.subText }]}>OUT</Text>
                    <Text style={[styles.detailValue, { color: C.text }]}>06:45 PM</Text>
                 </View>
              </View>
           </View>
           
           <View style={[styles.divider, { backgroundColor: C.gray100 }]} />
           
           <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                 <View style={[styles.detailIcon, { backgroundColor: '#4CAF5010' }]}>
                    <IconSymbol name="timer" size={18} color="#4CAF50" />
                 </View>
                 <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: C.subText }]}>WORKING</Text>
                    <Text style={[styles.detailValue, { color: C.text }]}>09h 30m</Text>
                 </View>
              </View>
              <View style={styles.detailItem}>
                 <View style={[styles.detailIcon, { backgroundColor: '#FF980010' }]}>
                    <IconSymbol name="bell.fill" size={18} color="#FF9800" />
                 </View>
                 <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: C.subText }]}>SHIFT</Text>
                    <Text style={[styles.detailValue, { color: C.text }]}>Day Shift</Text>
                 </View>
              </View>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Who's Working Now</Text>
        </View>

        <View style={styles.teamList}>
           {teamData.map((member, i) => (
             <View key={i} style={[styles.memberCard, { backgroundColor: C.card }]}>
                <View style={styles.memberLeft}>
                   <View style={[styles.memberAvatar, { backgroundColor: C.primary + '10' }]}>
                      <Text style={[styles.memberInitial, { color: C.primary }]}>{member.name.charAt(0)}</Text>
                   </View>
                   <View style={{ maxWidth: width * 0.4 }}>
                      <Text style={[styles.memberName, { color: C.text }]} numberOfLines={1}>{member.name}</Text>
                      <Text style={[styles.memberTime, { color: C.subText }]}>Logged in: {member.time}</Text>
                   </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: member.statusColor + '10' }]}>
                   <View style={[styles.statusDot, { backgroundColor: member.statusColor }]} />
                   <Text style={[styles.statusText, { color: member.statusColor }]}>{member.status}</Text>
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
  monthHeader: { paddingHorizontal: 20, marginBottom: 15 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 16, gap: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  monthText: { fontSize: 14, fontWeight: '800' },
  calendarCard: { marginHorizontal: 20, borderRadius: 28, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center', width: (width - 80) / 7 },
  weekDayName: { fontSize: 11, fontWeight: '700', marginBottom: 12 },
  dateCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dateText: { fontSize: 14, fontWeight: '800' },
  presentDot: { width: 4, height: 4, borderRadius: 2 },
  statsGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20 },
  statItem: { flex: 1, paddingVertical: 12, paddingHorizontal: 5, borderRadius: 20, alignItems: 'center', gap: 2, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statNum: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  statLab: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  detailCard: { marginHorizontal: 20, borderRadius: 24, paddingVertical: 15, paddingHorizontal: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.3, marginBottom: 1 },
  detailValue: { fontSize: 12, fontWeight: '800' },
  divider: { height: 1, marginVertical: 12 },
  teamList: { paddingHorizontal: 20, gap: 12 },
  memberCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 24, elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 16, fontWeight: '800' },
  memberName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  memberTime: { fontSize: 11, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
});
