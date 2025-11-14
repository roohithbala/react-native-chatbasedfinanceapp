import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';
import { router } from 'expo-router';
import biometricAuthService from '@/lib/services/biometricAuthService';
import { API_BASE_URL } from '@/lib/services/api';
import { useTheme } from '../context/ThemeContext';
import AuthHeader from './AuthHeader';
import AuthTabs from './AuthTabs';
import AuthForm from './AuthForm';
import BiometricAuth from './BiometricAuth';
import SocialAuth from './SocialAuth';
import OTPInput from './OTPInput';

// Helper to build API URLs safely (avoids duplicate '/api' segments)
const buildApiUrl = (path: string) => {
  const base = API_BASE_URL.replace(/\/+$/g, ''); // remove trailing slashes
  // ensure path starts with a single slash
  const p = path.startsWith('/') ? path : `/${path}`;

  if (base.endsWith('/api')) {
    // API_BASE_URL already includes /api, don't add another
    return `${base}${p}`;
  }

  // API_BASE_URL doesn't include /api, add it
  return `${base}/api${p}`;
};

// Professional Input Component (copied from AuthForm)
const ProfessionalInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  theme,
  disabled = false,
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  theme: any;
  disabled?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles = StyleSheet.create({
    inputGroup: {
      gap: 8,
      marginBottom: 12,
    },
    inputWrapper: {
      borderRadius: 12,
      height: 56,
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderColor: isFocused ? theme.primary : theme.border,
      borderWidth: isFocused ? 2 : 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    textInput: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
  });

  return (
    <View style={inputStyles.inputGroup}>
      <View style={inputStyles.inputWrapper}>
        <TextInput
          style={inputStyles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
        />
      </View>
    </View>
  );
};

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | null>(null);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpError, setOtpError] = useState<string | undefined>();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const { login, register, biometricLogin, googleAuth, sendOTP: sendOTPStore, verifyOTP: verifyOTPStore, otpLogin, isLoading: storeLoading, error, clearError } = useFinanceStore();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const enabled = await biometricAuthService.isBiometricEnabled();
      const type = await biometricAuthService.getStoredBiometricType();
      setBiometricEnabled(enabled);
      setBiometricType(type);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricEnabled) return;

    setIsLoading(true);
    clearError();

    try {
      await biometricLogin();
      Alert.alert('Success', 'Biometric login successful!');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Biometric login error:', error);
      Alert.alert('Authentication Failed', error.message || 'Biometric authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setIsLoading(true);
    clearError();

    try {
      console.log('Sending Google ID token to backend...');
      await googleAuth(idToken);
      Alert.alert('Success', 'Google authentication successful!');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Google auth error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Google authentication failed';
      Alert.alert('Authentication Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const loginIdentifier = email || username;
    if (!loginIdentifier.trim() || !password.trim()) {
      Alert.alert('Login Required', 'Please enter your email/username and password');
      return;
    }

    setIsLoading(true);
    clearError();
    setOtpError(undefined);

    try {
      console.log('Validating credentials and sending OTP to:', loginIdentifier);
      const loginData = email ? { email: email.trim(), password } : { username: username.trim(), password };
      const result = await login(loginData);
      console.log('Login result:', result);

      if (result && result.requiresOTP) {
        // OTP sent successfully, show OTP input
        Alert.alert('OTP Sent', `Please check your email for the verification code${email ? ` sent to ${email}` : ''}`);
        setShowOTPInput(true);
      } else {
        // This shouldn't happen with the new mandatory OTP flow
        throw new Error('Authentication service unavailable. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Unable to sign in. Please check your credentials and try again.';

      if (error.response?.status === 401) {
        errorMessage = 'Invalid email/username or password. Please check your credentials and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Account not found. Please check your email/username or create a new account.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    clearError();
    setOtpError(undefined);
    setOtp(''); // Clear current OTP input

    try {
      console.log('Resending OTP to email:', email);
      const result = await sendOTPStore(email.trim());
      console.log('Resend OTP result:', result);

      Alert.alert('OTP Resent', result.message || 'A new OTP has been sent to your email');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend OTP';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    clearError();
    setOtpError(undefined);

    try {
      const identifier = (email || username || '').trim();
      if (!identifier) {
        Alert.alert('Error', 'Please enter your email or username before verifying OTP');
        return;
      }

      console.log('🔐 Verifying OTP for identifier:', identifier);
      console.log('🔐 OTP being sent:', otp, 'Type:', typeof otp, 'Length:', otp.length);
      await otpLogin(identifier, otp);
      Alert.alert('Success', 'OTP login successful!');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('❌ OTP login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed';
      setOtpError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isLogin) {
      if (showOTPInput) {
        // Verify OTP
        await handleVerifyOTP();
      } else {
        // Send OTP first (this is now the main login action)
        await handleSendOTP();
      }
    } else {
      // Registration
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (!name || !username || !upiId) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setIsLoading(true);
      clearError();

      try {
        await register({ name, email, username, password, upiId });
        Alert.alert('Success', 'Registration successful!');
        router.replace('/(tabs)');
      } catch (error: any) {
        console.error('Registration error:', error);
        Alert.alert('Error', error.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTabChange = (loginMode: boolean) => {
    setIsLogin(loginMode);
    // Reset all form state when switching modes
    setShowOTPInput(false);
    setOtp('');
    setOtpError(undefined);
    setPassword('');
    setEmail('');
    setName('');
    setUsername('');
    setUpiId('');
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotPasswordStep('email');
    setForgotPasswordEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
  };

  const handleForgotPasswordSubmit = async () => {
    if (forgotPasswordStep === 'email') {
      // Step 1: Send reset OTP to email
      if (!forgotPasswordEmail.trim()) {
        Alert.alert('Error', 'Please enter your email address');
        return;
      }

      setIsLoading(true);
      try {
  // Call backend API to send reset OTP
  const url = buildApiUrl('/auth/forgot-password');
  console.log('Forgot password request ->', url, { email: forgotPasswordEmail.trim() });
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: forgotPasswordEmail.trim() }),
        });

        const text = await response.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

        console.log('Forgot password response:', response.status, data);

        if (response.ok) {
          Alert.alert('OTP Sent', 'Please check your email for the password reset code');
          setForgotPasswordStep('otp');
        } else {
          Alert.alert('Error', data.message || 'Failed to send reset email');
        }
      } catch (error: any) {
        console.error('Forgot password error:', error);
        Alert.alert('Error', 'Unable to send password reset email. Please try again.');
      } finally {
        setIsLoading(false);
      }

    } else if (forgotPasswordStep === 'otp') {
      // Step 2: Verify OTP and get reset token
      if (!otp || otp.length !== 6) {
        Alert.alert('Error', 'Please enter a valid 6-digit OTP');
        return;
      }

      setIsLoading(true);
      try {
  // Call backend API to verify OTP
  const url = buildApiUrl('/auth/verify-reset-otp');
  console.log('Verify reset OTP request ->', url, { email: forgotPasswordEmail.trim(), otp });
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: forgotPasswordEmail.trim(),
            otp: otp
          }),
        });

        const text = await response.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
        console.log('Verify reset OTP response:', response.status, data);

        if (response.ok) {
          setResetToken(data.resetToken);
          setForgotPasswordStep('newPassword');
          setOtp('');
        } else {
          Alert.alert('Error', data.message || 'Invalid OTP');
        }
      } catch (error: any) {
        console.error('OTP verification error:', error);
        Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      } finally {
        setIsLoading(false);
      }

    } else if (forgotPasswordStep === 'newPassword') {
      // Step 3: Reset password with new password
      if (!newPassword || newPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      setIsLoading(true);
      try {
  // Call backend API to reset password
  const url = buildApiUrl('/auth/reset-password');
  console.log('Reset password request ->', url, { resetToken, newPassword: '<<hidden>>' });
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resetToken: resetToken,
            newPassword: newPassword
          }),
        });

        const text = await response.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
        console.log('Reset password response:', response.status, data);

        if (response.ok) {
          Alert.alert('Success', 'Password reset successfully! You can now login with your new password.');
          setShowForgotPassword(false);
          setForgotPasswordStep('email');
          setForgotPasswordEmail('');
          setNewPassword('');
          setConfirmPassword('');
          setResetToken('');
        } else {
          Alert.alert('Error', data.message || 'Failed to reset password');
        }
      } catch (error: any) {
        console.error('Password reset error:', error);
        Alert.alert('Error', 'Failed to reset password. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPasswordClose = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setForgotPasswordEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setOtp('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[styles.backgroundGradient, { backgroundColor: theme.primary }]}
      />

      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={[styles.patternCircle, styles.patternCircle1]} />
        <View style={[styles.patternCircle, styles.patternCircle2]} />
        <View style={[styles.patternCircle, styles.patternCircle3]} />
        <View style={[styles.patternCircle, styles.patternCircle4]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <AuthHeader isLogin={isLogin} />

          <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
            <AuthTabs
              isLogin={isLogin}
              onTabChange={handleTabChange}
              disabled={isLoading || storeLoading}
            />

            <AuthForm
              isLogin={isLogin}
              email={email}
              setEmail={setEmail}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              otp={otp}
              setOtp={setOtp}
              name={name}
              setName={setName}
              upiId={upiId}
              setUpiId={setUpiId}
              onSubmit={handleSubmit}
              onResendOTP={handleResendOTP}
              onSwitchMode={handleSwitchMode}
              onForgotPassword={handleForgotPassword}
              isLoading={isLoading}
              storeLoading={storeLoading}
              showOTPInput={showOTPInput}
              otpError={otpError}
            />

            {isLogin && (
              <BiometricAuth
                biometricEnabled={biometricEnabled}
                biometricType={biometricType}
                onBiometricLogin={handleBiometricLogin}
                disabled={isLoading || storeLoading}
              />
            )}

            <SocialAuth
              onGoogleSignIn={handleGoogleSignIn}
              onGoogleError={(error: string) => {
                console.error('Google sign-in error:', error);
                Alert.alert('Google Sign-In Failed', error);
              }}
              disabled={isLoading || storeLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        animationType="slide"
        transparent={true}
        onRequestClose={handleForgotPasswordClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Reset Password</Text>
              <TouchableOpacity onPress={handleForgotPasswordClose}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {forgotPasswordStep === 'email' && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                  Enter your email address and we'll send you a reset code.
                </Text>
                <ProfessionalInput
                  placeholder="Email Address"
                  value={forgotPasswordEmail}
                  onChangeText={setForgotPasswordEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  theme={theme}
                  disabled={isLoading}
                />
              </View>
            )}

            {forgotPasswordStep === 'otp' && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                  Enter the 6-digit code sent to {forgotPasswordEmail}
                </Text>
                <OTPInput
                  length={6}
                  onComplete={setOtp}
                  onChange={setOtp}
                  disabled={isLoading}
                />
              </View>
            )}

            {forgotPasswordStep === 'newPassword' && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                  Enter your new password
                </Text>
                <ProfessionalInput
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  theme={theme}
                  disabled={isLoading}
                />
                <ProfessionalInput
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  theme={theme}
                  disabled={isLoading}
                />
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleForgotPasswordClose}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.primary }]}
                onPress={handleForgotPasswordSubmit}
                disabled={isLoading}
              >
                <Text style={[styles.submitButtonText, { color: theme.text }]}>
                  {isLoading ? 'Loading...' : forgotPasswordStep === 'email' ? 'Send Code' : forgotPasswordStep === 'otp' ? 'Verify Code' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -100,
  },
  patternCircle2: {
    width: 150,
    height: 150,
    top: 200,
    left: -75,
  },
  patternCircle3: {
    width: 100,
    height: 100,
    bottom: 100,
    right: 50,
  },
  patternCircle4: {
    width: 80,
    height: 80,
    bottom: -40,
    left: 100,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
    paddingTop: 20,
  },
  formContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 60,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: theme.surface,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.surfaceSecondary,
  },
  submitButton: {
    backgroundColor: theme.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});