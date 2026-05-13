import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FeedbackScreen() {
  const { isDarkMode } = useTheme();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['General', 'Bug Report', 'Suggestion', 'UI/UX', 'Performance'];

  const C = {
    primary: '#4361EE',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#1B1B2F',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    border: isDarkMode ? '#334155' : '#E9ECEF',
    star: '#FFB74D',
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Selection Required', 'Please provide a star rating.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please share your thoughts with us.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');
      
      // In a real app, you'd call your Feedback API here
      // const response = await fetch('...', { ... });
        credentials: 'include',
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: C.card }]} 
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Feedback</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Illustration/Hero Area */}
          <View style={styles.heroArea}>
            <View style={[styles.iconCircle, { backgroundColor: C.primary + '15' }]}>
              <IconSymbol name="bubble.left" size={40} color={C.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: C.text }]}>How was your experience?</Text>
            <Text style={[styles.heroSub, { color: C.subText }]}>Your feedback helps us improve the app for everyone.</Text>
          </View>

          {/* Star Rating */}
          <View style={[styles.card, { backgroundColor: C.card }]}>
            <Text style={[styles.label, { color: C.text }]}>Rate our service</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setRating(star)}
                  style={styles.starBtn}
                >
                  <IconSymbol 
                    name={star <= rating ? "star.fill" : "star"} 
                    size={36} 
                    color={star <= rating ? C.star : C.border} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Selection */}
          <View style={[styles.card, { backgroundColor: C.card }]}>
            <Text style={[styles.label, { color: C.text }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: category === item ? C.primary : (isDarkMode ? '#334155' : '#F1F3F5'),
                      borderColor: category === item ? C.primary : 'transparent'
                    }
                  ]}
                >
                  <Text style={[
                    styles.categoryText,
                    { color: category === item ? '#FFF' : C.subText }
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Message Input */}
          <View style={[styles.card, { backgroundColor: C.card }]}>
            <Text style={[styles.label, { color: C.text }]}>Tell us more</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  color: C.text, 
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8F9FB',
                  borderColor: C.border 
                }
              ]}
              placeholder="What can we improve?..."
              placeholderTextColor={C.subText}
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: C.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Submit Feedback</Text>
                <IconSymbol name="paperplane.fill" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20 },
  heroArea: { alignItems: 'center', marginVertical: 30 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 15 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  starBtn: { padding: 5 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryText: { fontSize: 13, fontWeight: '600' },
  input: {
    borderRadius: 16,
    padding: 15,
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
