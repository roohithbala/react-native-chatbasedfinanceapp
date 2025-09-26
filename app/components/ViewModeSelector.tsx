import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ViewModeSelectorProps {
  viewMode: 'list' | 'category' | 'participants';
  onViewModeChange: (mode: 'list' | 'category' | 'participants') => void;
}

export default function ViewModeSelector({
  viewMode,
  onViewModeChange
}: ViewModeSelectorProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.viewModeContainer}>
      <Text style={styles.sectionTitle}>Recent Expenses</Text>
      <View style={styles.viewModeButtons}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'category' && styles.viewModeButtonActive]}
          onPress={() => onViewModeChange('category')}
        >
          <Text style={[styles.viewModeText, viewMode === 'category' && styles.viewModeTextActive]}>
            📊 Category
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'participants' && styles.viewModeButtonActive]}
          onPress={() => onViewModeChange('participants')}
        >
          <Text style={[styles.viewModeText, viewMode === 'participants' && styles.viewModeTextActive]}>
            👥 People
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
          onPress={() => onViewModeChange('list')}
        >
          <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
            📝 List
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text || '#1E293B',
    flex: 1,
  },
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceSecondary || '#F8FAFC',
    borderRadius: 8,
    padding: 2,
    marginLeft: 16,
  },
  viewModeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: theme.primary || '#2563EB',
  },
  viewModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary || '#64748B',
    textAlign: 'center',
  },
  viewModeTextActive: {
    color: theme.surface || 'white',
  },
});