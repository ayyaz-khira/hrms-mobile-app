import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Gets the encrypted authorization token from secure storage.
 * Falls back to AsyncStorage on the Web.
 */
export const getSecureToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      const token = await AsyncStorage.getItem('user_token');
      return token ? token.trim() : null;
    }
    const token = await SecureStore.getItemAsync('user_token');
    return token ? token.trim() : null;
  } catch (error) {
    console.error('❌ [SecureStore] Failed to read token:', error);
    return null;
  }
};

/**
 * Saves the encrypted authorization token in secure storage.
 * Falls back to AsyncStorage on the Web.
 */
export const setSecureToken = async (token: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem('user_token', token.trim());
      return;
    }
    await SecureStore.setItemAsync('user_token', token.trim());
  } catch (error) {
    console.error('❌ [SecureStore] Failed to save token:', error);
  }
};

/**
 * Deletes the authorization token from secure storage.
 * Falls back to AsyncStorage on the Web.
 */
export const deleteSecureToken = async (): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem('user_token');
      return;
    }
    await SecureStore.deleteItemAsync('user_token');
  } catch (error) {
    console.error('❌ [SecureStore] Failed to delete token:', error);
  }
};
