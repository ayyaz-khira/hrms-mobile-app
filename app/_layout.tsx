import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider as CustomThemeProvider, useTheme } from '../context/ThemeContext';

import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CustomThemeProvider>
          <MainLayout />
        </CustomThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStore } from '../store/networkStore';

function NetworkBanner() {
  const isOffline = useNetworkStore((state) => state.isOffline);

  if (!isOffline) return null;

  return (
    <SafeAreaView edges={['bottom']} style={styles.bannerContainer}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerText}>No Internet Connection. Some actions may fail.</Text>
      </View>
    </SafeAreaView>
  );
}

function MainLayout() {
  const { isDarkMode } = useTheme();
  const setOffline = useNetworkStore((state) => state.setOffline);

  useEffect(() => {
    const checkConnection = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        await fetch('https://staging.microcrispr.com/', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setOffline(false);
      } catch (e) {
        clearTimeout(timeoutId);
        setOffline(true);
      }
    };

    // Check immediately
    checkConnection();

    // Check every 8 seconds
    const interval = setInterval(checkConnection, 8000);

    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="personal-details" />
          <Stack.Screen name="apply-leave" />
          <Stack.Screen name="leave-history" />
          <Stack.Screen name="gate-pass" />
          <Stack.Screen name="expense" />
          <Stack.Screen name="add-expense" />
          <Stack.Screen name="on-duty" />
          <Stack.Screen name="salary-slip" />
          <Stack.Screen name="holidays" />
          <Stack.Screen name="loan" />
          <Stack.Screen name="asset" />
          <Stack.Screen name="feedback" />
          <Stack.Screen name="education-details" />
          <Stack.Screen name="bank-details" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="languages" />
          <Stack.Screen name="appearance" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <NetworkBanner />
      </View>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#E03131',
  },
  bannerContent: {
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

