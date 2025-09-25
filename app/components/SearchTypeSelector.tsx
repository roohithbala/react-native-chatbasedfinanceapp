import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SearchTypeSelectorProps {
  searchType: 'email' | 'username';
  onSearchTypeChange: (type: 'email' | 'username') => void;
}

export default function SearchTypeSelector({
  searchType,
  onSearchTypeChange,
}: SearchTypeSelectorProps) {
  return (
    <View style={styles.searchTypeContainer}>
      <TouchableOpacity
        style={[styles.searchTypeButton, searchType === 'username' && styles.activeSearchType]}
        onPress={() => onSearchTypeChange('username')}
      >
        <Text style={[styles.searchTypeText, searchType === 'username' && styles.activeSearchTypeText]}>
          Username
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.searchTypeButton, searchType === 'email' && styles.activeSearchType]}
        onPress={() => onSearchTypeChange('email')}
      >
        <Text style={[styles.searchTypeText, searchType === 'email' && styles.activeSearchTypeText]}>
          Email
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeSearchType: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeSearchTypeText: {
    color: '#2563EB',
  },
});