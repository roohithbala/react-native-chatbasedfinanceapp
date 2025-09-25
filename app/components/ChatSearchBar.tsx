import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  placeholderTextColor = "#94A3B8",
}: ChatSearchBarProps) {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={placeholderTextColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
});