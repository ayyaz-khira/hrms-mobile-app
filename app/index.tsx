import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useLeaveStore } from '../store/leaveStore';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Clipboard,
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  primary: '#3B5BDB',
  primaryLight: '#E8EDFF',
  primaryDark: '#2846C4',
  gray50: '#F8F9FA',
  gray100: '#F1F3F5',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#868E96',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
  white: '#FFFFFF',
  danger: '#C92A2A',
  dangerLight: '#FFF0F0',
  success: '#2F9E44',
  successLight: '#EBFBEE',
};

// ─── Logo SVG ────────────────────────────────────────────────────────────────
const LogoMark = () => (
  <Image
    source={require('../assets/images/app_logo.png')}
    style={{ width: 240, height: 240, marginTop: -20, marginBottom: -50 }}
    resizeMode="contain"
  />
);

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <IconSymbol
    name={visible ? 'eye.fill' : 'eye.slash.fill'}
    size={18}
    color={C.gray500}
  />
);

const Toast = ({ message, isSuccess, visible }: { message: string, isSuccess: boolean, visible: boolean }) => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 20, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        isSuccess && styles.toastSuccess,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function NessScaleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', isSuccess: false });
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDiagModal, setShowDiagModal] = useState(false);

  const toastTimerRef = useRef<any>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        const userId = await AsyncStorage.getItem('user_id');
        if (token && userId) {
          try {
            await useLeaveStore.getState().fetchRoles(userId);
          } catch (rErr) {
            console.error('Failed to pre-fetch roles:', rErr);
          }
          router.replace('/(tabs)/home');
          return;
        }
      } catch (err) {
        console.error('Error checking auth state:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const showToast = (message: string, isSuccess = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, isSuccess });
    toastTimerRef.current = setTimeout(() => {
      setToast(t => ({ ...t, visible: false }));
    }, 2800);
  };

  const validate = () => {
    let valid = true;
    const trimmedEmail = email.trim();
    const isValidEmail = trimmedEmail.includes('@') ||
      trimmedEmail.startsWith('HR-') ||
      trimmedEmail.startsWith('MINIX-');

    if (!trimmedEmail || !isValidEmail) {
      setEmailError(true);
      valid = false;
    } else {
      setEmailError(false);
    }

    if (password.length < 6) {
      setPassError(true);
      valid = false;
    } else {
      setPassError(false);
    }

    return valid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    setLoading(true);
    setDiagnostics(null);

    try {
      const apiUrl = 'https://staging.microcrispr.com/api/method/hrms_application.api.mobile_login';
      const response = await fetch(apiUrl, {
        credentials: 'omit',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          usr: email.trim(),
          pwd: password,
        }),
      });

      const result = await response.json();
      console.warn('🔑 [DEBUG] Login response status:', response.status, 'Body:', result);

      if (response.ok && result.message && result.message.status === 'success') {
        const token = result.message.token;
        if (!token) {
          console.warn('❌ [DEBUG] Token is missing from successful login response!');
          setDiagnostics({ loginUrl: apiUrl, loginStatus: response.status, loginBody: result, error: 'Token missing' });
          showToast('Failed to retrieve token from server', false);
          setLoading(false);
          return;
        }
        
        console.warn('🔑 [DEBUG] Token Captured:', token);
        await AsyncStorage.setItem('user_token', token);

        // Fetch all user details including roles using the new GET API
        try {
          const detailsUrl = 'https://staging.microcrispr.com/api/method/hrms_application.api.get_user_details';
          const detailsResponse = await fetch(detailsUrl, {
            credentials: 'omit',
            method: 'GET',
            headers: {
              'Authorization': token.trim().replace(/^(bearer|token)\s+/i, ''),
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }
          });

          const detailsResult = await detailsResponse.json();
          console.warn('📡 [DEBUG] User details response status:', detailsResponse.status, 'Body:', detailsResult);

          if (!detailsResponse.ok) {
            const detailError = detailsResult.message || detailsResult.exception || 'Unauthorized to fetch user details';
            console.error('❌ [DEBUG] User details fetch failed:', detailError);
            setDiagnostics({ loginUrl: apiUrl, loginStatus: response.status, loginBody: result, detailsUrl, detailsStatus: detailsResponse.status, detailsBody: detailsResult, error: detailError });
            showToast(`Auth verification failed: ${detailError}`, false);
            await AsyncStorage.multiRemove(['user_token', 'user_id', 'employee_details']);
            setLoading(false);
            return;
          }

          const userData = detailsResult.message || detailsResult;
          if (userData && (userData.email || userData.name || userData.employee)) {
            console.warn('🆔 Found User Data for:', userData.email || userData.name);
            const userId = userData.employee || userData.name || email.trim();
            const userName = userData.employee_name || userData.first_name || email.split('@')[0];
            
            await AsyncStorage.setItem('user_id', userId);
            await AsyncStorage.setItem('user_name', userName);
            await AsyncStorage.setItem('employee_details', JSON.stringify(userData));
            
            // Set roles in global store immediately
            const roles = userData.roles || [];
            useLeaveStore.getState().setRoles(roles);
          } else {
            console.warn('⚠️ [DEBUG] User data structure not recognized:', userData);
            await AsyncStorage.setItem('user_id', email.trim());
          }
        } catch (err: any) {
          console.error('Failed to fetch details after login:', err);
          setDiagnostics({ loginUrl: apiUrl, loginStatus: response.status, loginBody: result, detailsUrl: 'https://staging.microcrispr.com/api/method/hrms_application.api.get_user_details', error: err.message || err });
          showToast(`Network error validating session: ${err.message || err}`, false);
          await AsyncStorage.multiRemove(['user_token', 'user_id', 'employee_details']);
          setLoading(false);
          return;
        }

        showToast('Login Successful', true);
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 500);
      } else {
        // Attempt to extract Frappe server error messages
        let errorMsg = 'Invalid credentials';
        if (result._server_messages) {
          try {
            const parsedMsgs = JSON.parse(result._server_messages);
            const firstMsg = parsedMsgs[0];
            if (firstMsg && firstMsg.message) {
              errorMsg = firstMsg.message.replace(/<[^>]*>/g, ''); // strip HTML tags
            }
          } catch (e) {
             console.error('Error parsing _server_messages:', e);
          }
        } else {
           errorMsg = result.message?.message || result.message || 'Invalid credentials';
        }
        
        console.error('❌ Login Failed. Reason:', errorMsg);
        setDiagnostics({ loginUrl: apiUrl, loginStatus: response.status, loginBody: result, error: errorMsg });
        showToast(errorMsg, false);
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      setDiagnostics({ loginUrl: 'https://staging.microcrispr.com/api/method/hrms_application.api.mobile_login', error: error.message || error });
      showToast('Network error. Please try again.', false);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <View style={styles.loginCard}>
        <View style={styles.heroSection}>
          <LogoMark />
          <Text style={styles.brandName}>CRONIC</Text>
        </View>
        <View style={styles.waveDivider} />

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSubtitle}>Sign in to your employee account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email / Employee ID</Text>
            <View style={[styles.inputWrap, emailError && styles.inputError]}>
              <TextInput
                style={styles.inputField}
                value={email}
                onChangeText={v => { setEmail(v); setEmailError(false); }}
                placeholder="MINIX-001 or name@company.com"
                placeholderTextColor={C.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            {emailError && (
              <Text style={styles.errorMsg}>⚠ Please enter a valid email or employee ID</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputWrap, passError && styles.inputError]}>
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                value={password}
                onChangeText={v => { setPassword(v); setPassError(false); }}
                placeholder="Enter your password"
                placeholderTextColor={C.gray400}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <EyeIcon visible={showPass} />
              </TouchableOpacity>
            </View>
            {passError && (
              <Text style={styles.errorMsg}>⚠ Password must be at least 6 characters</Text>
            )}
          </View>

          <TouchableOpacity style={styles.forgotRow} onPress={() => router.push('/forgot-password')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <IconSymbol name="questionmark.circle.fill" size={14} color={C.primary} />
              <Text style={styles.forgotLink}>Forgot password</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.85 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {diagnostics && (
            <TouchableOpacity
              style={styles.diagBtn}
              onPress={() => setShowDiagModal(true)}
              activeOpacity={0.8}
            >
              <IconSymbol name="info.circle.fill" size={14} color={C.danger} />
              <Text style={styles.diagBtnText}>View Authentication Diagnostics</Text>
            </TouchableOpacity>
          )}

          <View style={styles.helpRow}>
            <Text style={styles.helpText}>Need help? </Text>
            <TouchableOpacity onPress={() => showToast('Support: hr@nesscale.com', false)}>
              <Text style={styles.helpLink}>Contact HR Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showDiagModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDiagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Auth Diagnostics</Text>
              <TouchableOpacity
                onPress={() => setShowDiagModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <Text style={styles.diagIntro}>
                Detailed response logs from the auth server to help troubleshoot issues:
              </Text>

              {diagnostics?.error && (
                <View style={styles.diagErrorCard}>
                  <Text style={styles.diagSectionTitle}>Error Message</Text>
                  <Text style={styles.diagErrorText}>{diagnostics.error}</Text>
                </View>
              )}

              <View style={styles.diagSection}>
                <Text style={styles.diagSectionTitle}>1. Login API Call</Text>
                <Text style={styles.diagLabel}>Endpoint: <Text style={styles.diagValue}>{diagnostics?.loginUrl}</Text></Text>
                <Text style={styles.diagLabel}>Status Code: <Text style={styles.diagValue}>{diagnostics?.loginStatus}</Text></Text>
                <Text style={styles.diagLabel}>Response Payload:</Text>
                <ScrollView horizontal style={styles.codeScroll}>
                  <Text style={styles.codeBlock}>
                    {diagnostics?.loginBody ? JSON.stringify(diagnostics.loginBody, null, 2) : 'No response payload'}
                  </Text>
                </ScrollView>
              </View>

              {diagnostics?.detailsUrl && (
                <View style={styles.diagSection}>
                  <Text style={styles.diagSectionTitle}>2. User Details Verification Call</Text>
                  <Text style={styles.diagLabel}>Endpoint: <Text style={styles.diagValue}>{diagnostics.detailsUrl}</Text></Text>
                  <Text style={styles.diagLabel}>Status Code: <Text style={styles.diagValue}>{diagnostics.detailsStatus}</Text></Text>
                  <Text style={styles.diagLabel}>Request Headers:</Text>
                  <ScrollView horizontal style={styles.codeScroll}>
                    <Text style={styles.codeBlock}>
                      {JSON.stringify({ Authorization: diagnostics.loginBody?.message?.token || 'MISSING' }, null, 2)}
                    </Text>
                  </ScrollView>
                  <Text style={styles.diagLabel}>Response Payload:</Text>
                  <ScrollView horizontal style={styles.codeScroll}>
                    <Text style={styles.codeBlock}>
                      {diagnostics.detailsBody ? JSON.stringify(diagnostics.detailsBody, null, 2) : 'No response payload'}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => {
                const dump = JSON.stringify(diagnostics, null, 2);
                Clipboard.setString(dump);
                showToast('Diagnostics copied', true);
              }}
            >
              <Text style={styles.copyBtnText}>Copy Full Diagnostics JSON</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast {...toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginCard: {
    width: '100%',
    height: '100%',
    backgroundColor: C.gray100,
    borderRadius: 0,
    overflow: 'hidden',
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) - 20 : 10,
    paddingBottom: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
    color: C.gray900,
    letterSpacing: 2,
  },
  brandUnderline: {
    width: 40,
    height: 4,
    backgroundColor: '#0A4DA1',
    borderRadius: 2,
    marginTop: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: C.gray500,
    letterSpacing: 3,
    marginTop: 8,
  },
  heroDecorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(10, 77, 161, 0.04)',
  },
  heroDecorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(10, 77, 161, 0.06)',
  },
  waveDivider: {
    backgroundColor: C.white,
    height: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  formScroll: {
    flex: 1,
    backgroundColor: C.gray100,
  },
  formContent: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.gray900,
    marginBottom: 2,
  },
  formSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: C.gray500,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.gray700,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrap: {
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.gray300,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  inputError: {
    borderColor: C.danger,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.gray900,
    padding: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
  } as any,
  eyeBtn: {
    paddingLeft: 8,
  },
  errorMsg: {
    fontSize: 11,
    fontWeight: '700',
    color: C.danger,
    marginTop: 5,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  loginBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    minHeight: 44,
  },
  loginBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.gray300,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.gray500,
  },
  ssoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.gray100,
    borderWidth: 1,
    borderColor: C.gray300,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  ssoIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.gray800,
  },
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.gray200,
  },
  helpText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.gray500,
  },
  helpLink: {
    fontSize: 11,
    fontWeight: '800',
    color: C.primary,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: C.gray900,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  toastSuccess: {
    backgroundColor: C.success,
  },
  toastText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  diagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(201, 42, 42, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 42, 42, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  diagBtnText: {
    color: C.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.gray900,
  },
  modalCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: C.gray100,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.gray700,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalBodyContent: {
    paddingBottom: 24,
  },
  diagIntro: {
    fontSize: 13,
    color: C.gray600,
    lineHeight: 18,
    marginBottom: 16,
  },
  diagErrorCard: {
    backgroundColor: 'rgba(201, 42, 42, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(201, 42, 42, 0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  diagErrorText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: C.danger,
    fontWeight: '600',
    marginTop: 4,
  },
  diagSection: {
    marginBottom: 20,
    backgroundColor: C.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.gray200,
    padding: 14,
  },
  diagSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.gray800,
    marginBottom: 10,
  },
  diagLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.gray500,
    marginTop: 8,
    marginBottom: 2,
  },
  diagValue: {
    color: C.gray800,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  codeScroll: {
    backgroundColor: C.gray900,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  codeBlock: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#A5D6A7',
  },
  copyBtn: {
    backgroundColor: C.primary,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
