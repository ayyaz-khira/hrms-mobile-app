import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, FlatList, StatusBar, Alert, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

const LEAVE_TYPES = [
  { label: 'Casual Leave', icon: 'calendar', color: '#FF9800' },
  { label: 'Sick Leave', icon: 'bed.fill', color: '#F44336' },
  { label: 'Earned Leave', icon: 'star.fill', color: '#FFC107' },
  { label: 'Maternity Leave', icon: 'person.2.fill', color: '#E91E63' },
  { label: 'Privilege Leave', icon: 'person.fill', color: '#3F51B5' },
  { label: 'Compensatory Off', icon: 'clock.fill', color: '#4CAF50' },
  { label: 'Unpaid Leave', icon: 'doc.fill', color: '#9C27B0' }
];

export default function ApplyLeaveScreen() {
  const { isDarkMode } = useTheme();

  const [reason, setReason] = useState('Personal Work');
  const [startDate, setStartDate] = useState(new Date(2026, 4, 10)); // May 10, 2026
  const [endDate, setEndDate] = useState(new Date(2026, 4, 12));   // May 12, 2026
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'start' | 'end' | 'type'>('start');
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const C = {
    primary: '#4361EE',
    primaryLight: isDarkMode ? '#1E293B' : '#EEF2FF',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    white: isDarkMode ? '#1E293B' : '#FFFFFF',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    gray50: isDarkMode ? '#1E293B' : '#F8F9FA',
    gray100: isDarkMode ? '#334155' : '#F1F3F5',
    gray200: isDarkMode ? '#334155' : '#E9ECEF',
    gray400: isDarkMode ? '#64748B' : '#ADB5BD',
    gray500: isDarkMode ? '#94A3B8' : '#94A3B8',
    gray600: isDarkMode ? '#CBD5E1' : '#64748B',
    gray900: isDarkMode ? '#F8F9FB' : '#0F172A',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    border: isDarkMode ? '#334155' : '#E2E8F0',
  };

  const openPicker = (type: 'start' | 'end' | 'type') => {
    setPickerType(type);
    if (type === 'type') {
      setPickerVisible(true);
    } else {
      setShowNativeDatePicker(true);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowNativeDatePicker(false);
    } else if (Platform.OS === 'web') {
      setShowNativeDatePicker(false);
    }
    
    if (selectedDate) {
      if (pickerType === 'start') setStartDate(selectedDate);
      else if (pickerType === 'end') setEndDate(selectedDate);
    }
  };

  const handleSelectType = (value: string) => {
    setLeaveType(value);
    setPickerVisible(false);
  };

  // ==================== FIXED & IMPROVED SUBMIT FUNCTION ====================
  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Incomplete Form', 'Please provide a reason for your leave.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');

      // Critical Checks
      if (!token) {
        Alert.alert('Login Required', 'Please login again to submit leave.', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
        return;
      }

      if (!userId) {
        Alert.alert('Error', 'User information not found. Please login again.');
        return;
      }

      const payload = {
        employee: userId,
        leave_type: leaveType,
        from_date: formatDate(startDate),
        to_date: formatDate(endDate),
        reason: reason,
      };

      setIsSubmitting(true);

      const apiUrl = 'https://staging.microcrispr.com/api/method/hrms_application.api.leave_application';

      console.log('🔑 Token being sent:', token?.substring(0, 20) + '...');
      console.log('📦 Payload:', payload);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,                    // ← Main format (working in Postman)
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Server Status:', response.status);

      let result;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON Response:', text.substring(0, 300));
        throw new Error(`Server returned invalid response (${response.status})`);
      }

      console.log('📥 Full Response:', result);

      if (response.ok) {
        Alert.alert('Success', 'Your leave request has been submitted successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const errorMsg = result?.message ||
          result?._server_messages ||
          result?.exception ||
          'Failed to submit leave request';

        console.error('❌ Error Details:', errorMsg);

        if (errorMsg.toString().includes('Invalid Token') || response.status === 401) {
          Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
            { text: 'Login', onPress: () => router.replace('/login') }
          ]);
        } else {
          Alert.alert('Submission Failed', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
      }
    } catch (error: any) {
      console.error('🚨 Catch Block Error:', error);
      Alert.alert('Submission Failed', error.message || 'Could not connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <IconSymbol name="arrow.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Apply Leave</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: 50 }}>
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol name="calendar" size={16} color={C.primary} />
            <Text style={[styles.sectionTitle, { color: C.gray900 }]}>Duration</Text>
          </View>

          <View style={styles.dateRow}>
            <TouchableOpacity style={[styles.dateItem, { backgroundColor: C.gray50, borderColor: C.gray100 }]} onPress={() => openPicker('start')}>
              <Text style={[styles.dateLabel, { color: C.gray600 }]}>Start Date</Text>
              <Text style={[styles.dateValue, { color: C.gray900 }]}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateItem, { backgroundColor: C.gray50, borderColor: C.gray100 }]} onPress={() => openPicker('end')}>
              <Text style={[styles.dateLabel, { color: C.gray600 }]}>End Date</Text>
              <Text style={[styles.dateValue, { color: C.gray900 }]}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: C.card }]}>
          <View style={styles.sectionTitleRow}>
            <IconSymbol name="list.bullet.indent" size={16} color={C.primary} />
            <Text style={[styles.sectionTitle, { color: C.gray900 }]}>Leave Details</Text>
          </View>

          <TouchableOpacity style={[styles.typeSelect, { backgroundColor: C.gray50, borderColor: C.gray100 }]} onPress={() => openPicker('type')}>
            <View>
              <Text style={[styles.dateLabel, { color: C.gray600 }]}>Leave Type</Text>
              <Text style={[styles.dateValue, { color: C.gray900 }]}>{leaveType}</Text>
            </View>
            <IconSymbol name="chevron.down" size={18} color={C.gray400} />
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.gray600 }]}>Reason for Leave</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: C.gray50, borderColor: C.gray100, color: C.gray900 }]}
              placeholder="Describe your reason here..."
              placeholderTextColor={C.gray400}
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showNativeDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={pickerType === 'start' ? startDate : endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {showNativeDatePicker && Platform.OS === 'web' && (
        <Modal transparent visible={showNativeDatePicker} animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowNativeDatePicker(false)} />
            <View style={[styles.pickerContainer, { backgroundColor: C.white, width: 340, alignSelf: 'center', padding: 25, elevation: 20, shadowOpacity: 0.2 }]}>
              <Text style={[styles.pickerTitle, { color: C.gray900, marginBottom: 20, fontSize: 18 }]}>
                Select {pickerType === 'start' ? 'Start' : 'End'} Date
              </Text>
              <input 
                type="date" 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  border: `2px solid ${C.primary}40`,
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  backgroundColor: C.gray50,
                  color: C.gray900
                }}
                value={formatDate(pickerType === 'start' ? startDate : endDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    onDateChange({} as any, new Date(y, m - 1, d));
                  }
                }}
              />
              <TouchableOpacity 
                style={[styles.submitBtn, { marginHorizontal: 0, marginTop: 25, height: 50, borderRadius: 12 }]}
                onPress={() => setShowNativeDatePicker(false)}
              >
                <Text style={styles.submitBtnText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Picker Modal for Leave Type */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: C.white }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: C.gray900 }]}>Select Leave Type</Text>
            </View>

            <FlatList
              data={LEAVE_TYPES}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.typeItem}
                  onPress={() => handleSelectType(item.label)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: item.color + '20' }]}>
                    <IconSymbol name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.typeLabel, { color: C.gray900 }]}>{item.label}</Text>
                  {leaveType === item.label && <IconSymbol name="checkmark" size={20} color={C.primary} />}
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
  container: { flex: 1 },
  card: { marginHorizontal: '5%', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateItem: { flex: 1, padding: 15, borderRadius: 16, borderWidth: 1 },
  dateLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: '800' },
  typeSelect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: '700' },
  textArea: { borderRadius: 16, borderWidth: 1, padding: 15, fontSize: 14, fontWeight: '600', height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#4361EE', marginHorizontal: '5%', marginVertical: 20, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  pickerContainer: { borderRadius: 28, padding: 20, maxHeight: height * 0.7 },
  pickerHeader: { marginBottom: 20 },
  pickerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  typeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  typeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  typeLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  dateList: { gap: 10 },
  dateSelectItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, backgroundColor: '#F8F9FA' },
  dateSelectText: { fontSize: 15, fontWeight: '700' }
});