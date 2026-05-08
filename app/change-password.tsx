import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function ChangePasswordScreen() {
  const { isDarkMode } = useTheme();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleUpdate = () => {
    Alert.alert('Success', 'Password updated successfully!');
    router.back();
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
              <Text style={styles.headerTitle}>Update Password</Text>
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
           <View style={[styles.infoCard, { backgroundColor: '#F43F5E' }]}>
              <View style={styles.infoIcon}>
                 <IconSymbol name="lock.fill" size={32} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={styles.infoLabel}>Security Tip</Text>
                 <Text style={styles.infoValue}>Use a strong password with at least 8 characters, symbols, and numbers.</Text>
              </View>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: C.text }]}>Reset Password</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: C.card }]}>
           <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.subText }]}>Current Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
                 <IconSymbol name="lock.fill" size={18} color={C.subText} />
                 <TextInput 
                   style={[styles.input, { color: C.text }]}
                   secureTextEntry={!showOld}
                   placeholder="••••••••"
                   placeholderTextColor={C.subText}
                 />
                 <TouchableOpacity onPress={() => setShowOld(!showOld)}>
                    <IconSymbol name={showOld ? "eye.fill" : "eye.slash.fill"} size={18} color={C.subText} />
                 </TouchableOpacity>
              </View>
           </View>

           <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.subText }]}>New Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
                 <IconSymbol name="key.fill" size={18} color={C.subText} />
                 <TextInput 
                   style={[styles.input, { color: C.text }]}
                   secureTextEntry={!showNew}
                   placeholder="Enter new password"
                   placeholderTextColor={C.subText}
                 />
                 <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                    <IconSymbol name={showNew ? "eye.fill" : "eye.slash.fill"} size={18} color={C.subText} />
                 </TouchableOpacity>
              </View>
           </View>

           <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.subText }]}>Confirm New Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.gray50, borderColor: C.gray100 }]}>
                 <IconSymbol name="checkmark.circle.fill" size={18} color={C.subText} />
                 <TextInput 
                   style={[styles.input, { color: C.text }]}
                   secureTextEntry={!showConfirm}
                   placeholder="Confirm new password"
                   placeholderTextColor={C.subText}
                 />
                 <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <IconSymbol name={showConfirm ? "eye.fill" : "eye.slash.fill"} size={18} color={C.subText} />
                 </TouchableOpacity>
              </View>
           </View>

           <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
              <Text style={styles.updateBtnText}>Update Password</Text>
           </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
           <Text style={[styles.forgotText, { color: C.primary }]}>Forgot Password?</Text>
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
  summaryContainer: { paddingHorizontal: 20 },
  infoCard: { borderRadius: 24, padding: 20, elevation: 8, shadowColor: '#F43F5E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  infoValue: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', lineHeight: 16 },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  formCard: { marginHorizontal: 20, borderRadius: 28, padding: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, marginLeft: 5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 56, borderRadius: 16, borderWidth: 1, gap: 12 },
  input: { flex: 1, fontSize: 15, fontWeight: '700' },
  updateBtn: { backgroundColor: '#4361EE', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 4 },
  updateBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  forgotBtn: { marginTop: 25, alignSelf: 'center' },
  forgotText: { fontSize: 14, fontWeight: '800' },
});
