import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const SecuritySection: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>
      <TouchableOpacity
        style={styles.securityItem}
        onPress={() => Alert.alert('Security', 'All data is encrypted end-to-end')}
      >
        <View style={styles.securityIcon}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        </View>
        <Text style={styles.securityText}>End-to-End Encryption Active</Text>
        <View style={styles.securityBadge}>
          <Text style={styles.securityBadgeText}>Secure</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  securityBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  securityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});

export default SecuritySection;