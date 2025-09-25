import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  searchType: 'email' | 'username';
}

export default function UserSearchInput({
  value,
  onChangeText,
  searchType,
}: UserSearchInputProps) {
  return (
    <View style={styles.searchInputContainer}>
      <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={`Search by ${searchType}...`}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={searchType === 'email' ? 'none' : 'none'}
        keyboardType={searchType === 'email' ? 'email-address' : 'default'}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={20} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearButton: {
    padding: 4,
  },
});