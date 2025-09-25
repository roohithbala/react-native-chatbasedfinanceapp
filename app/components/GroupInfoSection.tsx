import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GroupInfoSection() {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoItem}>
        <Ionicons name="people" size={20} color="#64748B" />
        <Text style={styles.infoText}>
          You'll be the admin of this group
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Ionicons name="link" size={20} color="#64748B" />
        <Text style={styles.infoText}>
          An invite link will be generated automatically
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Ionicons name="chatbubbles" size={20} color="#64748B" />
        <Text style={styles.infoText}>
          Members can chat and split expenses
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 12,
    flex: 1,
  },
});