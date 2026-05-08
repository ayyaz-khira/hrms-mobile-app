import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform, Modal, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

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

  const openPicker = (type: 'out' | 'in') => {
    setActivePicker(type);
    setPickerVisible(true);
  };

  const handleSelectTime = (time: string) => {
    if (activePicker === 'out') setOutTime(time);
    else setInTime(time);
    setPickerVisible(false);
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

          <View style={[styles.historyItem, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
            <View style={styles.historyLeft}>
              <View style={[styles.historyIconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                <IconSymbol name="door.right.hand.open" size={18} color={C.primary} />
              </View>
              <View>
                <Text style={[styles.historyTitle, { color: C.text }]}>Personal Work</Text>
                <Text style={[styles.historySub, { color: C.subText }]}>28 Apr · 02:00 PM - 03:00 PM</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Approved</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: C.card, borderTopColor: C.gray100 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={() => router.back()}>
          <Text style={styles.applyBtnText}>Submit Request</Text>
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
  textArea: { fontSize: 14, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateInput: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1 },
  inputLabelSmall: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  dateValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1 },
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
