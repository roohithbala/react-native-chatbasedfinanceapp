import React, { useState, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';
import { router } from 'expo-router';
import biometricAuthService from '@/lib/services/biometricAuthService';
import { useTheme } from '../context/ThemeContext';
import AuthHeader from './AuthHeader';
import AuthTabs from './AuthTabs';
import AuthForm from './AuthForm';
import BiometricAuth from './BiometricAuth';
import SocialAuth from './SocialAuth';

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

  const { login, register, biometricLogin, googleAuth, isLoading: storeLoading, error, clearError } = useFinanceStore();
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

  const handleTabChange = (loginMode: boolean) => {
    setIsLogin(loginMode);
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
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
              password={password}
              setPassword={setPassword}
              name={name}
              setName={setName}
              username={username}
              setUsername={setUsername}
              upiId={upiId}
              setUpiId={setUpiId}
              onSubmit={handleSubmit}
              onSwitchMode={handleSwitchMode}
              isLoading={isLoading}
              storeLoading={storeLoading}
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
              onGoogleError={(error) => {
                console.error('Google sign-in error:', error);
                Alert.alert('Google Sign-In Failed', error);
              }}
              disabled={isLoading || storeLoading}
            />
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
});