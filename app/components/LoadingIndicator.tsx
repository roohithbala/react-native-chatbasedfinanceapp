import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingIndicatorProps {
  loading: boolean;
  message?: string;
}

export default function LoadingIndicator({ loading, message = "Loading expenses..." }: LoadingIndicatorProps) {
  if (!loading) return null;

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  loadingText: {
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 8,
    fontWeight: '500',
  },
});