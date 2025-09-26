import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SettlementTabsProps {
  activeTab: 'awaiting' | 'settled';
  onTabChange: (tab: 'awaiting' | 'settled') => void;
  awaitingCount: number;
  settledCount: number;
}

export default function SettlementTabs({
  activeTab,
  onTabChange,
  awaitingCount,
  settledCount,
}: SettlementTabsProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'awaiting' && styles.tabActive]}
        onPress={() => onTabChange('awaiting')}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={activeTab === 'awaiting' ? (theme.primary || '#8B5CF6') : (theme.textSecondary || '#64748B')}
        />
        <Text style={[styles.tabText, activeTab === 'awaiting' && styles.tabTextActive]}>
          Awaiting ({awaitingCount})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'settled' && styles.tabActive]}
        onPress={() => onTabChange('settled')}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={20}
          color={activeTab === 'settled' ? (theme.success || '#10B981') : (theme.textSecondary || '#64748B')}
        />
        <Text style={[styles.tabText, activeTab === 'settled' && styles.tabTextActive]}>
          Settled ({settledCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface || 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: theme.surfaceSecondary || '#F8FAFC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary || '#64748B',
    marginLeft: 8,
  },
  tabTextActive: {
    color: theme.text || '#1E293B',
  },
});