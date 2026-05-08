import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';

export default function AssetScreen() {
  const { isDarkMode } = useTheme();
  const [assetList, setAssetList] = useState([
    { name: 'MacBook Pro 14"', serial: 'MNX-LPT-2024-049', category: 'Laptop', status: 'Excellent', date: '12 Jan 2024', icon: 'house.fill', color: '#607D8B' },
    { name: 'Dell 27" Monitor', serial: 'MNX-MON-2024-012', category: 'Peripheral', status: 'Good', date: '15 Jan 2024', icon: 'square.grid.2x2.fill', color: '#2196F3' },
    { name: 'Logitech MX Master 3', serial: 'MNX-MSE-2024-008', category: 'Peripheral', status: 'Fair', date: '20 Jan 2024', icon: 'cart.fill', color: '#9C27B0' },
  ]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: '', category: '', reason: '' });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        const userId = await AsyncStorage.getItem('user_id');
        const apiUrl = 'https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_assets';
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': token || '',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ employee: userId })
        });

        if (response.ok) {
          const result = await response.json();
          const data = result.message || [];
          if (Array.isArray(data)) setAssetList(data);
        }
      } catch (e) {
        console.error('Failed to fetch assets', e);
      }
    };
    fetchAssets();
  }, []);

  const handleRequestSubmit = async () => {
    if (!requestForm.name || !requestForm.category || !requestForm.reason) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');
      const apiUrl = 'https://staging.microcrispr.com/api/method/hrms_application.api.request_new_asset';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          employee: userId,
          asset_name: requestForm.name,
          category: requestForm.category,
          reason: requestForm.reason,
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Your asset request has been submitted successfully.');
        setIsModalVisible(false);
        setRequestForm({ name: '', category: '', reason: '' });
      } else {
        const res = await response.json().catch(() => ({}));
        Alert.alert('Request Failed', res?.message || 'Failed to submit request');
      }
    } catch (error) {
      Alert.alert('Error', 'Communication failure with server');
    } finally {
      setLoading(false);
    }
  };

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
              <Text style={styles.headerTitle}>Asset Inventory</Text>
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
        <View style={styles.summaryContainer}>
          <View style={[styles.infoCard, { backgroundColor: C.primary }]}>
             <View style={styles.infoRow}>
                <View>
                   <Text style={styles.infoLabel}>Total Assigned</Text>
                   <Text style={styles.infoValue}>{assetList.length.toString().padStart(2, '0')} Items</Text>
                </View>
                <View style={styles.badge}>
                   <Text style={styles.badgeText}>Active</Text>
                </View>
             </View>
             <View style={styles.cardFooterInfo}>
                <IconSymbol name="person.badge.shield.check" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.infoSub}>Last Verified: March 2026</Text>
             </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>My Assets</Text>
        </View>

        <View style={styles.listContainer}>
          {assetList.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.assetCard, { backgroundColor: C.card }]}>
              <View style={styles.assetTop}>
                <View style={[styles.assetIcon, { backgroundColor: item.color + '15' }]}>
                  <IconSymbol name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={styles.assetMain}>
                   <Text style={[styles.assetName, { color: C.text }]}>{item.name}</Text>
                   <Text style={[styles.assetSerial, { color: C.subText }]}>{item.serial}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'Excellent' ? '#E8F5E9' : '#FFF3E0' }]}>
                   <Text style={[styles.statusText, { color: item.status === 'Excellent' ? '#2E7D32' : '#E65100' }]}>{item.status}</Text>
                </View>
              </View>
              
              <View style={[styles.assetDivider, { backgroundColor: C.gray100 }]} />
              
              <View style={styles.assetInfoRow}>
                 <View style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>Category</Text>
                    <Text style={[styles.infoItemValue, { color: C.text }]}>{item.category}</Text>
                 </View>
                 <View style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>Assigned Date</Text>
                    <Text style={[styles.infoItemValue, { color: C.text }]}>{item.date}</Text>
                 </View>
                 <TouchableOpacity style={styles.detailsBtn}>
                    <IconSymbol name="chevron.right" size={16} color={C.primary} />
                 </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.requestBtn} onPress={() => setIsModalVisible(true)}>
           <IconSymbol name="plus" size={18} color={C.primary} />
           <Text style={[styles.requestBtnText, { color: C.primary }]}>Request New Asset</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Request Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Asset Request</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Asset Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#334155' : '#F1F3F5', color: C.text }]}
                placeholder="e.g. Mechanical Keyboard"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                value={requestForm.name}
                onChangeText={(t) => setRequestForm(p => ({ ...p, name: t }))}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#334155' : '#F1F3F5', color: C.text }]}
                placeholder="e.g. Peripherals"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                value={requestForm.category}
                onChangeText={(t) => setRequestForm(p => ({ ...p, category: t }))}
              />

              <Text style={styles.inputLabel}>Reason for Request</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#334155' : '#F1F3F5', color: C.text }]}
                placeholder="Provide a brief reason..."
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                multiline
                numberOfLines={4}
                value={requestForm.reason}
                onChangeText={(t) => setRequestForm(p => ({ ...p, reason: t }))}
              />

              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: C.primary }]} 
                onPress={handleRequestSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  content: { flex: 1 },
  summaryContainer: { paddingHorizontal: 20 },
  infoCard: { borderRadius: 24, padding: 25, elevation: 8, shadowColor: '#4361EE', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  infoLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  infoValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  cardFooterInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  listContainer: { paddingHorizontal: 20 },
  assetCard: { borderRadius: 24, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12 },
  assetTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  assetIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  assetMain: { flex: 1 },
  assetName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  assetSerial: { fontSize: 11, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },
  assetDivider: { height: 1, marginBottom: 15 },
  assetInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoItem: { flex: 1 },
  infoItemLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },
  infoItemValue: { fontSize: 13, fontWeight: '800' },
  detailsBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(67, 97, 238, 0.1)', alignItems: 'center', justifyContent: 'center' },
  requestBtn: { marginHorizontal: 20, marginTop: 10, height: 56, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#4361EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(67, 97, 238, 0.05)' },
  requestBtnText: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 450 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  formContainer: { gap: 15 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: -10 },
  input: { height: 54, borderRadius: 12, paddingHorizontal: 15, fontSize: 15, fontWeight: '600' },
  textArea: { height: 100, paddingTop: 15, textAlignVertical: 'top' },
  submitBtn: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
