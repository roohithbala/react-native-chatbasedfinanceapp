import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, isLoading, error, clearError } = useFinanceStore();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    try {
      clearError();

      // Validation
      if (!formData.email.trim() || !formData.password.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (!validateEmail(formData.email.trim())) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      if (formData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }

      if (!isLogin) {
        if (!formData.name.trim()) {
          Alert.alert('Error', 'Name is required for registration');
          return;
        }

        if (!formData.username.trim()) {
          Alert.alert('Error', 'Username is required for registration');
          return;
        }

        // Username validation: only letters, numbers, and underscores
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(formData.username.trim())) {
          Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
      }

      if (isLogin) {
        await login(formData.email.trim(), formData.password);
        Alert.alert('Success', 'Welcome back!');
      } else {
        await register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
        });
        Alert.alert('Success', 'Account created successfully!');
      }

      // Clear form on success
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={['#2563EB', '#3B82F6']}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#F1F5F9']}
                style={styles.logo}
              >
                <Ionicons name="shield-checkmark" size={32} color="#2563EB" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>SecureFinance</Text>
            <Text style={styles.subtitle}>
              End-to-end encrypted finance management
            </Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              {!isLogin && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.name}
                      onChangeText={(value) => updateFormData('name', value)}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Username *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.username}
                      onChangeText={(value) => updateFormData('username', value)}
                      placeholder="Choose a username"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
                {!isLogin && (
                  <Text style={styles.passwordHint}>
                    Password must be at least 6 characters long
                  </Text>
                )}
              </View>

              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password *</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={formData.confirmPassword}
                      onChangeText={(value) => updateFormData('confirmPassword', value)}
                      placeholder="Confirm your password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#94A3B8', '#94A3B8'] : ['#2563EB', '#3B82F6']}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>
                    {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchModeButton}
                onPress={switchMode}
                disabled={isLoading}
              >
                <Text style={styles.switchModeText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={styles.switchModeLink}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.features}>
                <View style={styles.feature}>
                  <Ionicons name="lock-closed" size={16} color="#10B981" />
                  <Text style={styles.featureText}>End-to-end encryption</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Bank-level security</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="eye-off" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Zero data collection</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#2563EB',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
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
    color: '#1E293B',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  passwordToggle: {
    padding: 16,
  },
  passwordHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  switchModeText: {
    fontSize: 16,
    color: '#64748B',
  },
  switchModeLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
  features: {
    marginTop: 24,
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#64748B',
  },
});