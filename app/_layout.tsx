import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider as CustomThemeProvider, useTheme } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CustomThemeProvider>
        <MainLayout />
      </CustomThemeProvider>
    </GestureHandlerRootView>
  );
}

function MainLayout() {
  const { isDarkMode } = useTheme();

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="personal-details" />
        <Stack.Screen name="attendance-details" />
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
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </ThemeProvider>
  );
}

