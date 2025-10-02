import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';
import { router } from 'expo-router';
import biometricAuthService from '@/lib/services/biometricAuthService';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | null>(null);

  const { login, register, biometricLogin, isLoading: storeLoading, error, clearError } = useFinanceStore();
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

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && (!name || !username || !upiId)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      if (isLogin) {
        // Determine if input is email or username
        const isEmail = email.includes('@');
        const loginCredentials = isEmail
          ? { email: email.trim(), password }
          : { username: email.trim(), password };

        await login(loginCredentials);
        Alert.alert('Success', 'Login successful!');
        router.replace('/(tabs)');
      } else {
        await register({ name, email, username, password, upiId });
        Alert.alert('Success', 'Registration successful!');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.primary, theme.primaryLight, theme.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Chat Finance</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back!' : 'Join our community'}
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.tabContainer, { backgroundColor: theme.surfaceSecondary }]}>
              <TouchableOpacity
                style={[styles.tab, isLogin && [styles.activeTab, { backgroundColor: theme.surface }]]}
                onPress={() => setIsLogin(true)}
                disabled={isLoading || storeLoading}
              >
                <Text style={[styles.tabText, isLogin && [styles.activeTabText, { color: theme.primary }]]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && [styles.activeTab, { backgroundColor: theme.surface }]]}
                onPress={() => setIsLogin(false)}
                disabled={isLoading || storeLoading}
              >
                <Text style={[styles.tabText, !isLogin && [styles.activeTabText, { color: theme.primary }]]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {!isLogin && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
                      <TextInput
                        style={styles.textInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
                      <TextInput
                        style={[styles.textInput, { color: theme.text }]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Choose a username"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>UPI ID</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
                      <TextInput
                        style={[styles.textInput, { color: theme.text }]}
                        value={upiId}
                        onChangeText={setUpiId}
                        placeholder="Enter your UPI ID (e.g., user@paytm)"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Email or Username</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
                  <TextInput
                    style={[styles.textInput, { color: theme.text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email or username"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
                  <TextInput
                    style={[styles.textInput, { color: theme.text }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isLoading || storeLoading}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={[styles.submitText, { color: theme.text }]}>
                    {isLoading || storeLoading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {isLogin && biometricEnabled && (
                <View style={styles.biometricContainer}>
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.divider} />
                  </View>

                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricLogin}
                    disabled={isLoading || storeLoading}
                  >
                    <LinearGradient
                      colors={[theme.success, theme.success]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.biometricGradient}
                    >
                      <Ionicons
                        name={biometricType === 'fingerprint' ? 'finger-print' : biometricType === 'facial' ? 'person' : 'eye'}
                        size={24}
                        color={theme.text}
                      />
                      <Text style={[styles.biometricText, { color: theme.text }]}>
                        {biometricType === 'fingerprint' ? 'Use Fingerprint' :
                         biometricType === 'facial' ? 'Use Face ID' :
                         biometricType === 'iris' ? 'Use Iris' : 'Use Biometric'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.switchModeButton}
                onPress={() => setIsLogin(!isLogin)}
                disabled={isLoading || storeLoading}
              >
                <Text style={[styles.switchModeText, { color: theme.textSecondary }]}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={[styles.switchModeLink, { color: theme.primary }]}>
                    {isLogin ? 'Sign Up' : 'Login'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  formContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: theme.surface,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: theme.surfaceSecondary,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: theme.surface,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '700',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  switchModeText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  switchModeLink: {
    color: theme.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  biometricContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  biometricButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  biometricGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
});