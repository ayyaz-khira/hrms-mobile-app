import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Keyboard,
  Platform,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    source={require('../assets/images/logo.png')}
    style={{ width: 80, height: 80, marginBottom: 0 }}
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
  const [toast, setToast] = useState({ visible: false, message: '', isSuccess: false });

  const toastTimerRef = useRef<any>(null);

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

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://staging.microcrispr.com/api/method/hrms_application.api.mobile_login';
      const response = await fetch(apiUrl, {
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
      if (response.ok) {
        const message = result.message || result;
        console.log('🔑 Full login response:', JSON.stringify(result));
        
        // Ensure we actually got a token or valid response before proceeding
        if (!message.token && message !== 'authenticated' && !result.token) {
           showToast(message.message || message || 'Invalid credentials', false);
           setLoading(false);
           return;
        }

        let token = message.token || result.token || (message.api_key && message.api_secret ? `${message.api_key}:${message.api_secret}` : 'authenticated');
        
        // Standardize: Ensure API key/secret has 'token ' prefix for all future requests
        if (message.api_key && message.api_secret && !token.startsWith('token ')) {
          token = `token ${token}`;
        }
        
        console.log('🔑 Token Captured:', token.substring(0, 15) + '...');
        await AsyncStorage.setItem('user_token', token);
        
        // Since login didn't provide user details, we MUST fetch them now using the token
        try {
          const detailsResponse = await fetch('https://staging.microcrispr.com/api/method/hrms_application.api.get_employee_details', {
            method: 'POST',
            headers: {
              'Authorization': token, // Already has 'token ' prefix if needed
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ email: email.trim() })
          });
          
          const detailsResult = await detailsResponse.json();
          const empData = detailsResult.message;
          
          if (empData) {
            console.log('🆔 Found Employee ID:', empData.name);
            await AsyncStorage.setItem('user_id', empData.name);
            await AsyncStorage.setItem('user_name', empData.employee_name || email.split('@')[0]);
            await AsyncStorage.setItem('employee_details', JSON.stringify(empData));
          } else {
            // Fallback if details fetch fails
            await AsyncStorage.setItem('user_id', email.trim());
          }
        } catch (err) {
          console.error('Failed to fetch details after login:', err);
          await AsyncStorage.setItem('user_id', email.trim());
        }

        showToast('Login Successful', true);
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 500);
      } else {
        showToast(result.message || 'Invalid credentials', false);
      }
    } catch (error) {
      console.error('Login Error:', error);
      showToast('Network error. Please try again.', false);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <View style={styles.loginCard}>
        <View style={styles.heroSection}>
          <LogoMark />
          <Text style={styles.brandName}>CRONIX</Text>
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

          <TouchableOpacity style={styles.forgotRow} onPress={() => showToast('Reset link sent', true)}>
            <Text style={styles.forgotLink}>Forgot password?</Text>
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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.ssoBtn}
            onPress={() => showToast('SSO login coming soon', false)}
            activeOpacity={0.85}
          >
            <View style={styles.ssoIcon}>
              <Image
                source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
                style={{ width: 20, height: 20 }}
              />
            </View>
            <Text style={styles.ssoBtnText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ssoBtn}
            onPress={() => showToast('Microsoft SSO coming soon', false)}
            activeOpacity={0.85}
          >
            <View style={styles.ssoIcon}>
              <Image
                source={{ uri: 'https://img.icons8.com/color/48/000000/microsoft.png' }}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.ssoBtnText}>Sign in with Microsoft</Text>
          </TouchableOpacity>

          <View style={styles.helpRow}>
            <Text style={styles.helpText}>Need help? </Text>
            <TouchableOpacity onPress={() => showToast('Support: hr@nesscale.com', false)}>
              <Text style={styles.helpLink}>Contact HR Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

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
    backgroundColor: C.white,
    borderRadius: 0,
    overflow: 'hidden',
  },
  heroSection: {
    backgroundColor: C.white,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 44,
    paddingBottom: 20,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: C.gray900,
    letterSpacing: 1.2,
    marginTop: -10,
  },
  waveDivider: {
    height: 28,
    backgroundColor: C.white,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
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
    backgroundColor: C.white,
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
});
