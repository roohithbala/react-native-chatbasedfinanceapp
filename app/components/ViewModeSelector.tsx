import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface ViewModeSelectorProps {
  viewMode: 'list' | 'category';
  onViewModeChange: (mode: 'list' | 'category') => void;
}

export default function ViewModeSelector({
  viewMode,
  onViewModeChange
}: ViewModeSelectorProps) {
  return (
    <View style={styles.viewModeContainer}>
      <Text style={styles.sectionTitle}>Recent Expenses</Text>
      <View style={styles.viewModeButtons}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'category' && styles.viewModeButtonActive]}
          onPress={() => onViewModeChange('category')}
        >
          <Text style={[styles.viewModeText, viewMode === 'category' && styles.viewModeTextActive]}>
            📊 By Category
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
          onPress={() => onViewModeChange('list')}
        >
          <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
            📝 All
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#2563EB',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  viewModeTextActive: {
    color: 'white',
  },
});