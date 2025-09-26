import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  required?: boolean;
}

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  multiline,
  numberOfLines,
  keyboardType = 'default',
  required = false
}: FormInputProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}{required && ' *'}
      </Text>
      <TextInput
        style={[styles.textInput, multiline && styles.notesInput, { backgroundColor: theme.surface }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary || '#94A3B8'}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text || '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.surface || 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border || '#E2E8F0',
    color: theme.text || '#1E293B',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});