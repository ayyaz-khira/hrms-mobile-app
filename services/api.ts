import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getSecureToken, deleteSecureToken } from './secureStore';

const DEFAULT_RETRY = 1;

export const getAuthHeader = async (): Promise<string | null> => {
  return await getSecureToken();
};

const handleUnauthorized = async (status: number) => {
  if (status === 401 || status === 417) {
    await deleteSecureToken();
    await AsyncStorage.multiRemove(['user_id', 'employee_details']);
    try { router.replace('/'); } catch (e) { console.warn('Router replace failed', e); }
  }
};

export async function apiFetch(input: string, options: { method?: string; body?: any; retry?: number; headers?: Record<string,string> } = {}) {
  const { method = 'GET', body, retry = DEFAULT_RETRY, headers = {} } = options;

  const token = await getAuthHeader();
  const userId = await AsyncStorage.getItem('user_id');

  const commonHeaders: Record<string,string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: token } : {}),
    ...(token && !token.toLowerCase().includes('token') ? { sid: token } : {}),
    ...headers,
  };

  const fullInit = {
    credentials: 'include' as RequestCredentials,
    method,
    headers: commonHeaders,
    body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
  };

  let attempts = 0;
  let lastErr: any = null;
  while (attempts <= retry) {
    attempts++;
    try {
      const res = await fetch(input, fullInit);
      if (res.status === 401 || res.status === 417) {
        await handleUnauthorized(res.status);
      }
      return res;
    } catch (e) {
      lastErr = e;
      // simple retry for transient network errors
      if (attempts > retry) break;
      await new Promise(r => setTimeout(r, 300 * attempts));
    }
  }
  throw lastErr;
}

export async function apiJson(input: string, options: { method?: string; body?: any; retry?: number; headers?: Record<string,string> } = {}) {
  const res = await apiFetch(input, options);
  try {
    const json = await res.json().catch(() => ({}));
    return { res, json };
  } catch (e) {
    return { res, json: {} };
  }
}

export default apiFetch;
