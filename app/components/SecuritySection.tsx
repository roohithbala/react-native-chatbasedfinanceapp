import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, hexToRgba } from '../context/ThemeContext';

export const SecuritySection: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>
      <TouchableOpacity
        style={styles.securityItem}
        onPress={() => Alert.alert('Security', 'All data is encrypted end-to-end')}
      >
        <View style={styles.securityIcon}>
          <Ionicons name="shield-checkmark" size={20} color={theme.success} />
        </View>
        <Text style={styles.securityText}>End-to-End Encryption Active</Text>
        <View style={styles.securityBadge}>
          <Text style={styles.securityBadgeText}>Secure</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

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
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: hexToRgba(theme.success, 0.2), // 20% opacity
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: hexToRgba(theme.success, 0.4), // 40% opacity
  },
  securityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: hexToRgba(theme.success, 0.3), // 30% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.success,
  },
  securityBadge: {
    backgroundColor: theme.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  securityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.surface,
  },
});

export default SecuritySection;