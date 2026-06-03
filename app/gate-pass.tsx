import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform, Modal, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const TIMES = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
];

export default function GatePassScreen() {
  const { isDarkMode } = useTheme();
  const [reason, setReason] = useState('');
  const [outTime, setOutTime] = useState('01:30 PM');
  const [inTime, setInTime] = useState('02:30 PM');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'out' | 'in'>('out');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterStart, setFilterStart] = useState<Date | null>(null);
  const [filterEnd, setFilterEnd] = useState<Date | null>(null);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [filterPickerType, setFilterPickerType] = useState<'start' | 'end'>('start');

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');
      if (!token || !userId) return;

      // Smart Auth Header
      const rawToken = token.trim();
      const authHeader = rawToken.toLowerCase().startsWith('bearer ') ? rawToken : `Bearer ${rawToken}`;

      const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_gate_pass', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ employee: userId.trim() })
      });

      const result = await response.json();
      if (response.ok) {
        const message = result.message;
        const data = message?.data || (Array.isArray(message) ? message : []);
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch History Error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const C = {
    primary: '#4361EE',
    primaryLight: '#EEF2FF',
    danger: '#EF4444',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    gray50: isDarkMode ? '#334155' : '#F8F9FA',
    gray100: isDarkMode ? '#334155' : '#F1F3F5',
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const openPicker = (type: 'out' | 'in') => {
    setActivePicker(type);
    setPickerVisible(true);
  };

  const handleSelectTime = (time: string) => {
    if (activePicker === 'out') setOutTime(time);
    else setInTime(time);
    setPickerVisible(false);
  };

  const onFilterDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowFilterPicker(false);
    if (selectedDate) {
      if (filterPickerType === 'start') setFilterStart(selectedDate);
      else setFilterEnd(selectedDate);
    }
  };

  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date || a.creation).getTime();
    const dateB = new Date(b.date || b.creation).getTime();
    return dateB - dateA;
  });

  const filteredHistory = sortedHistory.filter(item => {
    if (!filterStart && !filterEnd) return true;
    const itemDate = new Date(item.date || item.creation);
    if (filterStart && itemDate < new Date(filterStart.setHours(0,0,0,0))) return false;
    if (filterEnd && itemDate > new Date(filterEnd.setHours(23,59,59,999))) return false;
    return true;
  });

  const displayHistory = (!filterStart && !filterEnd) ? filteredHistory.slice(0, 5) : filteredHistory;
  const convertTo24h = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the gate pass.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');

      if (!token || !userId) {
        Alert.alert('Error', 'Authentication failed. Please login again.');
        router.replace('/');
        return;
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const payload = {
        employee: userId.trim(),
        reason: reason,
        date: dateStr,
        gpass_from: convertTo24h(outTime),
        gpass_in: convertTo24h(inTime),
      };

      console.log('📡 Submitting Gate Pass:', payload);

      const response = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.create_gate_pass', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('📥 Gate Pass Response:', result);

      if (response.ok) {
        Alert.alert('Success', 'Gate Pass request submitted successfully!');
        setReason('');
        fetchHistory();
      } else {
        Alert.alert('Error', result.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Gate Pass Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
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
              <Text style={styles.headerTitle}>Gate Pass Request</Text>
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
              <IconSymbol name="door.right.hand.open" size={16} color="#2196F3" />
            </View>
            <Text style={[styles.sectionLabel, { color: C.text }]}>Exit Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.text }]}>Reason for Exit</Text>
            <View style={[styles.textAreaContainer, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
              <TextInput
                style={[styles.textArea, { color: C.text }]}
                placeholder="Briefly describe the reason for your exit..."
                placeholderTextColor={C.subText}
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
              />
            </View>
          </View>

          <View style={styles.dateRow}>
            <TouchableOpacity 
              style={[styles.dateInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}
              onPress={() => openPicker('out')}
            >
              <Text style={styles.inputLabelSmall}>Out Time</Text>
              <View style={styles.dateValueRow}>
                <Text style={[styles.dateText, { color: C.text }]}>{outTime}</Text>
                <IconSymbol name="clock.fill" size={16} color={C.primary} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.dateInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}
              onPress={() => openPicker('in')}
            >
              <Text style={styles.inputLabelSmall}>In Time</Text>
              <View style={styles.dateValueRow}>
                <Text style={[styles.dateText, { color: C.text }]}>{inTime}</Text>
                <IconSymbol name="clock.fill" size={16} color={C.primary} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#E8F5E9' }]}>
              <IconSymbol name="clock.arrow.circlepath" size={16} color="#4CAF50" />
            </View>
            <Text style={[styles.sectionLabel, { color: C.text }]}>History</Text>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.filterInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}
              onPress={() => {
                setFilterPickerType('start');
                setShowFilterPicker(true);
              }}
            >
              <Text style={styles.filterLabel}>From Date</Text>
              <Text style={[styles.filterValue, { color: C.text }]}>{filterStart ? filterStart.toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'All'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterInput, { backgroundColor: C.gray50, borderColor: C.gray100 }]}
              onPress={() => {
                setFilterPickerType('end');
                setShowFilterPicker(true);
              }}
            >
              <Text style={styles.filterLabel}>To Date</Text>
              <Text style={[styles.filterValue, { color: C.text }]}>{filterEnd ? filterEnd.toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'All'}</Text>
            </TouchableOpacity>

            {(filterStart || filterEnd) && (
              <TouchableOpacity onPress={() => { setFilterStart(null); setFilterEnd(null); }} style={styles.clearBtn}>
                <IconSymbol name="xmark.circle.fill" size={20} color={C.danger} />
              </TouchableOpacity>
            )}
          </View>

          {showFilterPicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date())}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onFilterDateChange}
              maximumDate={new Date(2030, 11, 31)}
              minimumDate={new Date(2020, 0, 1)}
            />
          )}

          {showFilterPicker && Platform.OS === 'web' && (
            <Modal transparent visible={showFilterPicker} animationType="fade">
              <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFilterPicker(false)} />
                <View style={[styles.pickerContainer, { 
                  backgroundColor: C.white, 
                  width: 360, 
                  alignSelf: 'center', 
                  padding: 24, 
                  paddingBottom: 32,
                  borderRadius: 28,
                  elevation: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 25,
                  position: 'relative'
                }]}>
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ backgroundColor: C.primary + '15', padding: 12, borderRadius: 16, marginBottom: 12 }}>
                      <IconSymbol name="calendar" size={24} color={C.primary} />
                    </View>
                    <Text style={[styles.pickerTitle, { color: C.text, fontSize: 18, fontWeight: '800' }]}>
                      Select {filterPickerType === 'start' ? 'Start' : 'End'} Date
                    </Text>
                    <Text style={{ color: C.subText, fontSize: 12, marginTop: 4 }}>Pick a date to filter your history</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    <select 
                      style={{ 
                        flex: 2,
                        padding: '16px', 
                        borderRadius: '16px', 
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date())).getDate()}
                      onChange={(e) => {
                        const current = filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date());
                        onFilterDateChange({} as any, new Date(current.getFullYear(), current.getMonth(), parseInt(e.target.value)));
                      }}
                    >
                      {[...Array(31)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                    </select>

                    <select 
                      style={{ 
                        flex: 3,
                        padding: '16px', 
                        borderRadius: '16px', 
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date())).getMonth()}
                      onChange={(e) => {
                        const current = filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date());
                        onFilterDateChange({} as any, new Date(current.getFullYear(), parseInt(e.target.value), current.getDate()));
                      }}
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>

                    <select 
                      style={{ 
                        flex: 3,
                        padding: '16px', 
                        borderRadius: '16px', 
                        border: `2px solid ${C.gray100}`,
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: C.gray50,
                        color: C.text,
                        outline: 'none',
                      }}
                      value={(filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date())).getFullYear()}
                      onChange={(e) => {
                        const current = filterPickerType === 'start' ? (filterStart || new Date()) : (filterEnd || new Date());
                        onFilterDateChange({} as any, new Date(parseInt(e.target.value), current.getMonth(), current.getDate()));
                      }}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.applyBtn, { marginTop: 12, height: 56, borderRadius: 16 }]}
                    onPress={() => setShowFilterPicker(false)}
                  >
                    <Text style={[styles.applyBtnText, { fontSize: 16 }]}>Confirm Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
          {loadingHistory ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 10 }} />
          ) : displayHistory.length > 0 ? (
            displayHistory.map((item, idx) => (
              <View key={idx} style={[styles.historyItem, { backgroundColor: C.gray50, borderColor: C.gray100, marginBottom: 12 }]}>
                <View style={[styles.historyLeft, { flex: 1 }]}>
                  <View style={[styles.historyIconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                    <IconSymbol name="door.right.hand.open" size={18} color={C.primary} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.historyTitle, { color: C.text }]} numberOfLines={1}>{item.reason}</Text>
                    <Text style={[styles.historySub, { color: C.subText }]}>
                      {item.date ? new Date(item.date).toLocaleDateString([], { day: '2-digit', month: 'short' }) : (item.creation ? new Date(item.creation).toLocaleDateString([], { day: '2-digit', month: 'short' }) : '')} · {(item.gpass_from || item.out_time)?.substring(0, 5)} - {(item.gpass_in || item.in_time)?.substring(0, 5)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'Approved' ? '#E8F5E9' : '#FFF3E0', minWidth: 70 }]}>
                  <Text style={[styles.statusText, { color: item.status === 'Approved' ? '#4CAF50' : '#FF9800' }]}>{item.status || 'Pending'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: C.subText, textAlign: 'center', marginTop: 10, fontSize: 12 }}>No recent requests</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: C.card, borderTopColor: C.gray100 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.applyBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.applyBtnText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={pickerVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: C.card }]}>
            <View style={styles.pickerIndicator} />
            <Text style={[styles.pickerTitle, { color: C.text }]}>Select {activePicker === 'out' ? 'Out' : 'In'} Time</Text>
            <FlatList
              data={TIMES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.pickerItem, { borderBottomColor: C.gray100 }]} 
                  onPress={() => handleSelectTime(item)}
                >
                  <Text style={[styles.pickerItemText, { color: C.text }]}>{item}</Text>
                  {(activePicker === 'out' ? outTime : inTime) === item && (
                    <IconSymbol name="checkmark" size={20} color={C.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
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
  content: { flex: 1 },
  card: { marginHorizontal: 20, borderRadius: 24, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '700' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  textAreaContainer: { borderRadius: 16, padding: 15, borderWidth: 1, minHeight: 100 },
  textArea: { fontSize: 14, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateInput: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1 },
  inputLabelSmall: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  dateValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 15, flexWrap: 'wrap' },
  filterInput: { minWidth: 100, flex: 1, borderRadius: 12, padding: 8, borderWidth: 1 },
  filterLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  filterValue: { fontSize: 13, fontWeight: '700' },
  clearBtn: { padding: 5 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginHorizontal: 2 },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  historyTitle: { fontSize: 14, fontWeight: '700' },
  historySub: { fontSize: 11, marginTop: 2 },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#2E7D32', fontSize: 10, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 25, gap: 12, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F3F5' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  applyBtn: { flex: 2, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B1B2F' },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerContainer: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, maxHeight: '60%' },
  pickerIndicator: { width: 40, height: 5, backgroundColor: '#CBD5E1', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  pickerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 16, fontWeight: '600' },
});
