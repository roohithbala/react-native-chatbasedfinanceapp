import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const AuthFeatures: React.FC = () => {
  return (
    <View style={styles.featuresContainer}>
      <Text style={styles.featuresTitle}>Why choose SecureFinance?</Text>
      <View style={styles.features}>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="lock-closed" size={16} color="#10b981" />
          </View>
          <Text style={styles.featureText}>End-to-end encryption</Text>
        </View>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="eye-off" size={16} color="#10b981" />
          </View>
          <Text style={styles.featureText}>Privacy first</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  featuresContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '48%',
    marginBottom: 16,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
});