import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { useFinanceStore } from '../lib/store/financeStore';
import type { Expense, Group, SplitBill, SplitBillParticipant } from '../../lib/store/types';

const menuItems = [
  {
    icon: 'person-outline',
    title: 'Edit Profile',
    subtitle: 'Update your personal information',
    action: 'editProfile',
  },
  {
    icon: 'notifications-outline',
    title: 'Payment Reminders',
    subtitle: 'Manage split bill payment reminders',
    action: 'reminders',
  },
  {
    icon: 'card-outline',
    title: 'Payment Methods',
    subtitle: 'Add and manage payment methods',
    action: 'paymentMethods',
  },
  {
    icon: 'download-outline',
    title: 'Export Data',
    subtitle: 'Download your financial data',
    action: 'exportData',
  },
  {
    icon: 'help-circle-outline',
    title: 'Help & Support',
    subtitle: 'Get help and contact support',
    action: 'helpSupport',
  },
];

interface AccountSectionProps {
  onMenuAction: (action: string) => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({ onMenuAction }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { currentUser, expenses, groups, splitBills, budgets } = useFinanceStore() as any;

  const handleExportData = async () => {
    try {
      Alert.alert(
        'Export Data',
        'Choose export format:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'JSON',
            onPress: () => exportAsJSON()
          },
          {
            text: 'CSV',
            onPress: () => exportAsCSV()
          }
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const exportAsJSON = async () => {
    try {
      const exportData = {
        user: {
          id: currentUser?._id,
          name: currentUser?.name,
          email: currentUser?.email,
          username: currentUser?.username,
        },
        expenses: (expenses as Expense[]).map(expense => ({
          id: expense._id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.createdAt,
          groupId: expense.groupId,
        })),
        groups: (groups as Group[])?.map((group: Group) => ({
          id: group._id,
          name: group.name,
          members: group.members?.length || 0,
        })) || [],
        splitBills: (splitBills as SplitBill[]).map((bill: SplitBill) => ({
          id: bill._id,
          description: bill.description,
          amount: bill.totalAmount,
          participants: bill.participants?.map((p: SplitBillParticipant) => ({
            userId: p.userId,
            amount: p.amount,
            isPaid: p.isPaid,
          })),
          createdAt: bill.createdAt,
        })),
        budgets: Object.entries(budgets || {}).map(([category, amount]) => ({
          category,
          amount,
        })),
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const filename = `finance_data_${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For mobile, save to file system and share
        const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Financial Data',
          });
        } else {
          Alert.alert('Success', `Data exported to ${fileUri}`);
        }
      }

      Alert.alert('Success', 'Your financial data has been exported successfully!');
    } catch (error) {
      console.error('JSON export error:', error);
      Alert.alert('Error', 'Failed to export data as JSON. Please try again.');
    }
  };

  const exportAsCSV = async () => {
    try {
      // Create CSV for expenses
      let csvContent = 'Date,Description,Amount,Category,Group\n';
      (expenses as Expense[]).forEach(expense => {
        const date = new Date(expense.createdAt).toLocaleDateString();
        const description = `"${expense.description.replace(/"/g, '""')}"`;
        csvContent += `${date},${description},${expense.amount},${expense.category},${expense.groupId || ''}\n`;
      });

      const filename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For mobile, save to file system and share
        const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Expenses as CSV',
          });
        } else {
          Alert.alert('Success', `Expenses exported to: ${fileUri}`);
        }
      }

      Alert.alert('Success', 'Your expenses have been exported as CSV!');
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert('Error', 'Failed to export data as CSV. Please try again.');
    }
  };

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'paymentMethods':
        Alert.alert('Payment Methods', 'Payment methods feature coming soon!');
        break;
      case 'exportData':
        handleExportData();
        break;
      case 'helpSupport':
        Alert.alert('Help & Support', 'For support, email us at roohithbala@outlook.com\n\nPortfolio: https://roohithbala.github.io/portfolio/');
        break;
      default:
        onMenuAction(action);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.menuItem, { backgroundColor: theme.surface }]}
          onPress={() => handleMenuPress(item.action)}
        >
          <View style={styles.menuIcon}>
            <Ionicons name={item.icon as any} size={24} color={theme.textSecondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default AccountSection;

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});