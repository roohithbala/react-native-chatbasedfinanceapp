import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';

interface ExpensesHeaderProps {
  activeTab: 'expenses' | 'splitBills';
  onTabChange: (tab: 'expenses' | 'splitBills') => void;
  totalExpenses: number;
  totalSplitBills: number;
  settlementStats: {
    awaiting: number;
    totalAwaiting: number;
    settled: number;
    totalSettled: number;
  };
  onReload?: () => void;
}

export default function ExpensesHeader({
  activeTab,
  onTabChange,
  totalExpenses,
  totalSplitBills,
  settlementStats,
  onReload
}: ExpensesHeaderProps) {
  const { theme } = useTheme();
  const { groups, selectedGroup, selectGroup } = useFinanceStore();
  const styles = getStyles(theme);

  const handleGroupSelect = (group: any) => {
    selectGroup(group);
  };
  return (
    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>💰 My Spending</Text>
        {onReload && (
          <TouchableOpacity style={styles.reloadButton} onPress={onReload}>
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Group Selector - only show if there are groups */}
      {groups && groups.length > 0 && (
        <View style={styles.groupSelector}>
          <Text style={styles.groupSelectorLabel}>Viewing:</Text>
          <View style={styles.groupSelectorContainer}>
            <TouchableOpacity
              style={[styles.groupOption, !selectedGroup && styles.groupOptionActive]}
              onPress={() => handleGroupSelect(null)}
            >
              <Text style={[styles.groupOptionText, !selectedGroup && styles.groupOptionTextActive]}>
                All Expenses
              </Text>
            </TouchableOpacity>
            {groups.map((group) => (
              <TouchableOpacity
                key={group._id}
                style={[styles.groupOption, selectedGroup?._id === group._id && styles.groupOptionActive]}
                onPress={() => handleGroupSelect(group)}
              >
                <Text style={[styles.groupOptionText, selectedGroup?._id === group._id && styles.groupOptionTextActive]}>
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Main Tab Navigation */}
      <View style={styles.mainTabContainer}>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'expenses' && styles.mainTabActive]}
          onPress={() => onTabChange('expenses')}
        >
          <Ionicons
            name="wallet-outline"
            size={20}
            color={activeTab === 'expenses' ? theme.primary : '#64748B'}
          />
          <Text style={[styles.mainTabText, activeTab === 'expenses' && styles.mainTabTextActive]}>
            My Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'splitBills' && styles.mainTabActive]}
          onPress={() => onTabChange('splitBills')}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === 'splitBills' ? '#8B5CF6' : '#64748B'}
          />
          <Text style={[styles.mainTabText, activeTab === 'splitBills' && styles.mainTabTextActive]}>
            Shared Bills
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Stats based on active tab */}
      {activeTab === 'expenses' ? (
        <View style={styles.tagsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>{theme.currency}{(totalExpenses || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Shared Bills</Text>
            <Text style={styles.statValue}>{theme.currency}{(totalSplitBills || 0).toFixed(2)}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.tagsContainer}>
          <TouchableOpacity style={styles.statBox} onPress={() => router.push('/you-owe')}>
            <Text style={styles.statLabel}>I Owe</Text>
            <Text style={styles.statValue}>{settlementStats.awaiting}</Text>
            <Text style={styles.statSubValue}>{theme.currency}{(settlementStats.totalAwaiting || 0).toFixed(2)}</Text>
          </TouchableOpacity>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>I Paid</Text>
            <Text style={styles.statValue}>{settlementStats.settled}</Text>
            <Text style={styles.statSubValue}>{theme.currency}{(settlementStats.totalSettled || 0).toFixed(2)}</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  groupSelector: {
    marginBottom: 16,
  },
  groupSelectorLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  groupSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  groupOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'white',
  },
  groupOptionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  groupOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  mainTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  mainTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
  mainTabTextActive: {
    color: 'white',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statSubValue: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});