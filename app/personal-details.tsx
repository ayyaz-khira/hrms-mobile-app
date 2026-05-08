import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export default function PersonalDetailsScreen() {
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [details, setDetails] = useState({
    employeeID: '',
    fullName: '',
    department: '',
    emergencyContact: '',
    contactPerson: '',
    relation: '',
  });

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      setLoading(true);

      try {
        // 1. Load cached data first (instant UI)
        const cached = await AsyncStorage.getItem('employee_details');

        if (cached) {
          const data = JSON.parse(cached);

          setDetails({
            employeeID: data.name ?? '',
            fullName: data.employee_name ?? '',
            department: data.department ?? '',
            emergencyContact: data.emergency_phone_number ?? 'Not Set',
            contactPerson: data.person_to_be_contacted ?? 'Not Set',
            relation: data.relation ?? 'Not Set',
          });
        }

        // 2. Fetch fresh data from API
        const token = await AsyncStorage.getItem('user_token');
        const userId = await AsyncStorage.getItem('user_id');

        const response = await fetch(
          'https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_details',
          {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              employee: userId,
            }),
          }
        );

        const result = await response.json();
        const data = result?.message;

        console.log('API DATA:', data);

        if (data) {
          // save cache
          await AsyncStorage.setItem(
            'employee_details',
            JSON.stringify(data)
          );

          // update UI
          setDetails({
            employeeID: data.name ?? '',
            fullName: data.employee_name ?? '',
            department: data.department ?? '',
            emergencyContact: data.emergency_phone_number ?? 'Not Set',
            contactPerson: data.person_to_be_contacted ?? 'Not Set',
            relation: data.relation ?? 'Not Set',
          });
        }
      } catch (e) {
        console.error('Failed to fetch employee details', e);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, []);

  const C = {
    primary: '#4361EE',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    gray50: isDarkMode ? '#334155' : '#F8F9FA',
    gray100: isDarkMode ? '#334155' : '#F1F3F5',
  };

  const handleSave = async () => {
    if (isEditing) {
      try {
        await AsyncStorage.setItem('user_name', details.fullName);
        Alert.alert('Success', 'Details updated successfully!');
      } catch (e) {
        console.error('Failed to save name', e);
      }
    }
    setIsEditing(!isEditing);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <IconSymbol name="arrow.left" size={24} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Personal Details</Text>

              <TouchableOpacity onPress={handleSave} style={styles.editIconBtn}>
                <IconSymbol
                  name={isEditing ? 'checkmark' : 'pencil'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <View style={{ marginTop: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ marginTop: 10, color: C.subText }}>
              Fetching details...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <DetailRow label="Employee ID" value={details.employeeID} C={C} />
              <DetailRow
                label="Full Name"
                value={details.fullName}
                C={C}
                isEditing={isEditing}
                onChange={(v: string) =>
                  setDetails((prev) => ({ ...prev, fullName: v }))
                }
              />
              <DetailRow label="Department" value={details.department} C={C} />
            </View>

            <View style={styles.card}>
              <DetailRow
                label="Contact Person"
                value={details.contactPerson}
                C={C}
                isEditing={isEditing}
                onChange={(v: string) =>
                  setDetails((prev) => ({ ...prev, contactPerson: v }))
                }
              />
              <DetailRow
                label="Relation"
                value={details.relation}
                C={C}
                isEditing={isEditing}
                onChange={(v: string) =>
                  setDetails((prev) => ({ ...prev, relation: v }))
                }
              />
              <DetailRow
                label="Phone Number"
                value={details.emergencyContact}
                C={C}
                isEditing={isEditing}
                onChange={(v: string) =>
                  setDetails((prev) => ({ ...prev, emergencyContact: v }))
                }
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const DetailRow = ({ label, value, isEditing, onChange, C }: any) => (
  <View style={styles.detailRow}>
    <Text style={[styles.label, { color: C.subText }]}>{label}</Text>

    {isEditing ? (
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[styles.input, { color: C.text, backgroundColor: C.gray50 }]}
      />
    ) : (
      <Text style={{ color: C.text, fontWeight: '700' }}>{value}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },

  headerContainer: { zIndex: 10 },
  headerBg: { paddingBottom: 10, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  backBtn: { padding: 8 },
  editIconBtn: { padding: 8 },

  card: {
    margin: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
  },

  detailRow: {
    marginBottom: 16,
  },

  label: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '700',
  },

  input: {
    padding: 10,
    borderRadius: 10,
    fontWeight: '700',
  },
});