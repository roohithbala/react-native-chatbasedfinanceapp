import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import OTPInput from './OTPInput';

// Professional Input Component without floating labels
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

interface AuthFormProps {
  isLogin: boolean;
  email: string;
  setEmail: (email: string) => void;
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  name: string;
  setName: (name: string) => void;
  upiId: string;
  setUpiId: (upiId: string) => void;
  onSubmit: () => void;
  onResendOTP?: () => void;
  onSwitchMode: () => void;
  onForgotPassword?: () => void;
  isLoading: boolean;
  storeLoading: boolean;
  showOTPInput: boolean;
  showSignupOTP?: boolean;
  otpError?: string;
  authError?: string | null;
  onClearError?: () => void;
}

export default function AuthForm({
  isLogin,
  email,
  setEmail,
  username,
  setUsername,
  password,
  setPassword,
  otp,
  setOtp,
  name,
  setName,
  upiId,
  setUpiId,
  onSubmit,
  onResendOTP,
  onSwitchMode,
  onForgotPassword,
  isLoading,
  storeLoading,
  showOTPInput,
  showSignupOTP = false,
  otpError,
  authError,
  onClearError
}: AuthFormProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.form}>
      {!isLogin && (
        <>
          <ProfessionalInput
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            theme={theme}
            disabled={isLoading || storeLoading}
          />

          <ProfessionalInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            theme={theme}
            disabled={isLoading || storeLoading}
          />

          <ProfessionalInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            theme={theme}
            disabled={isLoading || storeLoading}
          />

          <ProfessionalInput
            placeholder="UPI ID (e.g., user@paytm)"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
            keyboardType="email-address"
            theme={theme}
            disabled={isLoading || storeLoading}
          />
        </>
      )}

      {isLogin ? (
        showOTPInput ? (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Enter OTP</Text>
            <OTPInput
              length={6}
              onComplete={setOtp}
              onChange={setOtp}
              disabled={isLoading || storeLoading}
              error={otpError}
            />
            <TouchableOpacity
              style={styles.resendButton}
              onPress={onResendOTP}
              disabled={isLoading || storeLoading}
            >
              <Text style={[styles.resendText, { color: theme.primary }]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginInputs}>
            <ProfessionalInput
              placeholder="Email or Username"
              value={email || username}
              onChangeText={(text) => {
                // Clear both fields when user starts typing
                if (email && username) {
                  setEmail('');
                  setUsername('');
                }
                // Determine if it's email or username
                if (text.includes('@')) {
                  setEmail(text);
                  setUsername('');
                } else {
                  setUsername(text);
                  setEmail('');
                }
              }}
              autoCapitalize="none"
              keyboardType={email ? "email-address" : "default"}
              theme={theme}
              disabled={isLoading || storeLoading}
            />

            <View style={{ gap: 8 }}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={password}
                  onChangeText={(text) => { setPassword(text); onClearError && onClearError(); }}
                  placeholder="Password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPassword}
                  editable={!isLoading && !storeLoading}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: 16 }}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {authError ? (
              <Text style={{ color: '#EF4444', marginTop: 6 }}>{authError}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={onForgotPassword}
              disabled={isLoading || storeLoading}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        showSignupOTP ? (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Enter Verification Code</Text>
            <OTPInput
              length={6}
              onComplete={setOtp}
              onChange={setOtp}
              disabled={isLoading || storeLoading}
              error={otpError}
            />
            <TouchableOpacity
              style={styles.resendButton}
              onPress={onResendOTP}
              disabled={isLoading || storeLoading}
            >
              <Text style={[styles.resendText, { color: theme.primary }]}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                value={password}
                onChangeText={(text) => { setPassword(text); onClearError && onClearError(); }}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showPassword}
                editable={!isLoading && !storeLoading}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: 16 }}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )
      )}

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.primary }]}
        onPress={onSubmit}
        disabled={isLoading || storeLoading}
      >
        <View style={styles.submitGradient}>
          <Text style={[styles.submitText, { color: theme.text }]}>
            {isLoading || storeLoading ? 'Loading...' : (
              isLogin ? (showOTPInput ? 'Verify OTP' : 'Login') : (showSignupOTP ? 'Verify Code' : 'Sign Up')
            )}
          </Text>
        </View>
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
    gap: 16,
    paddingVertical: 10,
  },
  loginInputs: {
    gap: 12,
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
    position: 'relative',
    borderRadius: 16,
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    fontSize: 16,
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
    paddingVertical: 16,
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
  resendButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});