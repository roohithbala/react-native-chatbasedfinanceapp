import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ChatSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
}

export default function ChatSearchBar({
  value,
  onChangeText,
  placeholder = "Search users...",
  placeholderTextColor,
}: ChatSearchBarProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={placeholderTextColor || theme.inputPlaceholder}
      />
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
});