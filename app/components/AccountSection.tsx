import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const menuItems = [
  {
    icon: 'person-outline',
    title: 'Edit Profile',
    subtitle: 'Update your personal information',
    action: 'editProfile',
  },
  {
    icon: 'people-outline',
    title: 'Manage Groups',
    subtitle: 'View and manage your groups',
    action: 'manageGroups',
  },
  {
    icon: 'add-circle-outline',
    title: 'Join Group',
    subtitle: 'Join a group with invite code',
    action: 'joinGroup',
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
  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'paymentMethods':
        Alert.alert('Coming Soon', 'Payment methods coming soon!');
        break;
      case 'exportData':
        Alert.alert('Coming Soon', 'Data export coming soon!');
        break;
      case 'helpSupport':
        Alert.alert('Help', 'For support, email us at support@securefinance.com');
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