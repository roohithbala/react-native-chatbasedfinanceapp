import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface AuthFormProps {
  isLogin: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  upiId: string;
  setUpiId: (upiId: string) => void;
  onSubmit: () => void;
  onSwitchMode: () => void;
  isLoading: boolean;
  storeLoading: boolean;
}

export default function AuthForm({
  isLogin,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  username,
  setUsername,
  upiId,
  setUpiId,
  onSubmit,
  onSwitchMode,
  isLoading,
  storeLoading
}: AuthFormProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.form}>
      {!isLogin && (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
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
        onPress={onSubmit}
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

      <TouchableOpacity
        style={styles.switchModeButton}
        onPress={onSwitchMode}
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
  );
}

const getStyles = (theme: any) => StyleSheet.create({
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
});