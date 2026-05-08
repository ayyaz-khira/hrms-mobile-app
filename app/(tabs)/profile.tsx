import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Dimensions, Platform, StatusBar, Image, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [userName, setUserName] = useState('Harsh Rajput');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const savedName = await AsyncStorage.getItem('user_name');
          if (savedName) setUserName(savedName);
          
          const savedImage = await AsyncStorage.getItem('profile_image');
          if (savedImage) setProfileImage(savedImage);
        } catch (e) {
          console.error('Failed to load profile data', e);
        }
      };
      loadData();
    }, [])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return alert('Permissions needed');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem("profile_image", uri);
      setImagePickerVisible(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return alert('Permissions needed');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem("profile_image", uri);
      setImagePickerVisible(false);
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

  const menuItems = [
    { title: 'Personal Details', icon: 'person.fill', color: '#4361EE', route: '/personal-details' },
    { title: 'Education Details', icon: 'graduationcap.fill', color: '#4CAF50', route: '/education-details' },
    { title: 'Bank & Statutory', icon: 'creditcard.fill', color: '#FF9800', route: '/bank-details' },
    { title: 'Gate Pass', icon: 'door.right.hand.open', color: '#E91E63', route: '/gate-pass' },
    { title: 'Appearance', icon: 'paintbrush.fill', color: '#9C27B0', route: '/appearance' },
    { title: 'Languages', icon: 'character.book.closed.fill', color: '#00BCD4', route: '/languages' },
    { title: 'Change Password', icon: 'lock.fill', color: '#F44336', route: '/change-password' },
  ];

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      {/* Fixed Header */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <View style={{ width: 40 }} />
              <Text style={styles.headerTitle}>My Profile</Text>
              <TouchableOpacity style={styles.logoutIconBtn} onPress={() => router.replace('/')}>
                <IconSymbol name="arrow.right.to.line" size={20} color="#FF5A5F" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarContainer, { borderColor: C.primary }]}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: C.primary }]}>{userName.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => setImagePickerVisible(true)}>
              <IconSymbol name="camera.fill" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: C.text }]}>{userName}</Text>
          <Text style={[styles.userRole, { color: C.subText }]}>Software Engineer • MINIX</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: C.card }]}>
            <Text style={[styles.statValue, { color: C.text }]}>05 May</Text>
            <Text style={[styles.statLabel, { color: C.subText }]}>Joined</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: C.card }]}>
            <Text style={[styles.statValue, { color: C.text }]}>IT Dept</Text>
            <Text style={[styles.statLabel, { color: C.subText }]}>Dept</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: C.card }]}>
            <Text style={[styles.statValue, { color: C.text }]}>Full Time</Text>
            <Text style={[styles.statLabel, { color: C.subText }]}>Type</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, { backgroundColor: C.card }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                  <IconSymbol name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.menuItemText, { color: C.text }]}>{item.title}</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={C.gray100} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.themeToggleCard, { backgroundColor: C.card }]}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFD70015' }]}>
              <IconSymbol name={isDarkMode ? "sun.max.fill" : "zzz"} size={20} color="#FFD700" />
            </View>
            <View>
              <Text style={[styles.menuItemText, { color: C.text }]}>Dark Mode</Text>
              <Text style={[styles.themeSubText, { color: C.subText }]}>{isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}</Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#CBD5E1', true: C.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal visible={imagePickerVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setImagePickerVisible(false)}>
          <View style={[styles.pickerCard, { backgroundColor: C.card }]}>
            <View style={styles.pickerIndicator} />
            <Text style={[styles.pickerTitle, { color: C.text }]}>Update Profile Photo</Text>
            <View style={styles.pickerOptions}>
              <TouchableOpacity style={styles.pickerOption} onPress={takePhoto}>
                <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#334155' : '#EEF2FF' }]}>
                  <IconSymbol name="camera.fill" size={24} color={C.primary} />
                </View>
                <Text style={[styles.optionText, { color: C.subText }]}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerOption} onPress={pickImage}>
                <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#334155' : '#E8F5E9' }]}>
                  <IconSymbol name="photo.fill" size={24} color="#4CAF50" />
                </View>
                <Text style={[styles.optionText, { color: C.subText }]}>From Gallery</Text>
              </TouchableOpacity>
            </View>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  logoutIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,90,95,0.1)', borderRadius: 12 },
  content: { flex: 1 },
  profileSection: { alignItems: 'center', marginTop: 10, marginBottom: 25 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(67,97,238,0.05)', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 40, fontWeight: '800' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#4361EE', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  userName: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  userRole: { fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 30 },
  statItem: { flex: 1, padding: 12, borderRadius: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statValue: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  menuContainer: { paddingHorizontal: 20, gap: 12, marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  menuIconContainer: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { fontSize: 15, fontWeight: '700' },
  themeToggleCard: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 50 },
  themeSubText: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerCard: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 50 },
  pickerIndicator: { width: 40, height: 5, backgroundColor: '#CBD5E1', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  pickerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 30 },
  pickerOptions: { flexDirection: 'row', justifyContent: 'space-around' },
  pickerOption: { alignItems: 'center', gap: 12 },
  optionIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  optionText: { fontSize: 13, fontWeight: '700' },
});
