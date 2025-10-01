import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  isLoading: boolean;
  progress?: number; // 0-1
  size?: 'small' | 'large';
  color?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  isLoading,
  progress,
  size = 'large',
  color = '#007AFF',
}) => {
  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {progress !== undefined && (
        <View style={styles.progressText}>
          <Text style={[styles.progressValue, { color }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProgressIndicator;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 1000,
  },
  progressText: {
    position: 'absolute',
    top: 40,
    left: -10,
    right: -10,
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});