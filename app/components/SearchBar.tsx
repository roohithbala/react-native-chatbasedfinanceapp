import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search users...",
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={theme.textSecondary || '#64748B'} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.textSecondary || '#94A3B8'}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: theme.surface || 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border || '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text || '#1E293B',
  },
});

export default SearchBar;