import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const InsightsHeader: React.FC = () => {
  return (
    <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
      <Text style={styles.headerTitle}>AI Insights</Text>
      <Text style={styles.headerSubtitle}>Powered by financial intelligence</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default InsightsHeader;