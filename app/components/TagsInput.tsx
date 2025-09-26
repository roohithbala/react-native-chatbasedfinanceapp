import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface TagsInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function TagsInput({ value, onChangeText }: TagsInputProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>🏷️ Tags (Optional)</Text>
      <TextInput
        style={[styles.textInput, { backgroundColor: theme.surface }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Add tags separated by commas (e.g., lunch, work, urgent)"
        placeholderTextColor="#94A3B8"
        maxLength={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
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
});