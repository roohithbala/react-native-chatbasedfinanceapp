import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isFocused?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
  autoComplete?: 'name' | 'email' | 'username' | 'current-password' | 'new-password';
  secureTextEntry?: boolean;
  hint?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  isFocused = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  secureTextEntry = false,
  hint,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused
      ]}>
        <Ionicons name={iconName} size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          secureTextEntry={secureTextEntry}
        />
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  isFocused?: boolean;
  hint?: string;
  autoComplete?: 'current-password' | 'new-password';
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  showPassword,
  onTogglePassword,
  isFocused = false,
  hint,
  autoComplete,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused
      ]}>
        <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete={autoComplete}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={onTogglePassword}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#64748b"
          />
        </TouchableOpacity>
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 8,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  passwordToggle: {
    padding: 16,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '400',
  },
});