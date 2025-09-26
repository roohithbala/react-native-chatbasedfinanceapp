import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const emotions = [
  { emoji: '😊', label: 'Happy', percentage: 45, color: '#10B981' },
  { emoji: '😐', label: 'Neutral', percentage: 30, color: '#64748B' },
  { emoji: '😟', label: 'Worried', percentage: 20, color: '#F59E0B' },
  { emoji: '😰', label: 'Stressed', percentage: 5, color: '#EF4444' },
];

export const EmotionalAnalysis: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Emotional Spending Analysis</Text>
      <View style={styles.emotionContainer}>
        {emotions.map((emotion, index) => (
          <View key={index} style={[styles.emotionCard, { backgroundColor: theme.surface }]}>
            <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
            <Text style={styles.emotionLabel}>{emotion.label}</Text>
            <View style={styles.emotionProgressContainer}>
              <View style={styles.emotionProgressTrack}>
                <View
                  style={[
                    styles.emotionProgressFill,
                    {
                      width: `${emotion.percentage}%`,
                      backgroundColor: emotion.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.emotionPercentage}>{emotion.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
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
  emotionContainer: {
    gap: 12,
  },
  emotionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emotionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  emotionProgressContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  emotionProgressTrack: {
    width: 80,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  emotionProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emotionPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default EmotionalAnalysis;