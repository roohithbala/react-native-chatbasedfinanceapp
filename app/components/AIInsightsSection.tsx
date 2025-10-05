import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface AIInsightsSectionProps {
  isLoading: boolean;
  insights: any[];
  onRefresh: () => void;
}

const sampleInsights = [
  {
    id: 1,
    title: 'Spending Pattern Alert',
    description: 'Your food expenses have increased by 15% this week',
    type: 'warning',
    icon: '⚠️',
  },
  {
    id: 2,
    title: 'Budget Achievement',
    description: 'Great job! You\'re 20% under your entertainment budget',
    type: 'success',
    icon: '🎉',
  },
  {
    id: 3,
    title: 'Saving Opportunity',
    description: 'Consider brewing coffee at home to save $40/month',
    type: 'tip',
    icon: '💡',
  },
  {
    id: 4,
    title: 'Prediction Alert',
    description: 'You may exceed your monthly budget by $75 at current pace',
    type: 'prediction',
    icon: '🔮',
  },
];

const getInsightIcon = (type: string): string => {
  switch (type) {
    case 'warning': return '⚠️';
    case 'success': return '✅';
    case 'danger': return '🚨';
    case 'info': return '💡';
    case 'tip': return '💡';
    case 'prediction': return '🔮';
    default: return '📊';
  }
};

const getInsightColor = (type: string): [ColorValue, ColorValue] => {
  switch (type) {
    case 'warning': return ['#F59E0B', '#FBBF24'] as [ColorValue, ColorValue];
    case 'success': return ['#10B981', '#34D399'] as [ColorValue, ColorValue];
    case 'danger': return ['#EF4444', '#F87171'] as [ColorValue, ColorValue];
    case 'info': return ['#3B82F6', '#60A5FA'] as [ColorValue, ColorValue];
    case 'tip': return ['#3B82F6', '#60A5FA'] as [ColorValue, ColorValue];
    case 'prediction': return ['#8B5CF6', '#A78BFA'] as [ColorValue, ColorValue];
    default: return ['#64748B', '#94A3B8'] as [ColorValue, ColorValue];
  }
};

export const AIInsightsSection: React.FC<AIInsightsSectionProps> = ({
  isLoading,
  insights,
  onRefresh,
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Insights & Predictions</Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.surfaceSecondary }]}
          onPress={onRefresh}
          disabled={isLoading}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={isLoading ? theme.textSecondary : theme.primary}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing your spending patterns...</Text>
        </View>
      ) : (
        (insights.length > 0 ? insights.map((insight: any, index: number) => ({
          ...insight,
          id: insight.id || `insight-${index}`,
          icon: insight.icon || getInsightIcon(insight.type)
        })) : sampleInsights).map((insight: any) => (
          <TouchableOpacity key={insight.id || insight.title} style={styles.insightCard}>
            <LinearGradient
              colors={getInsightColor(insight.type)}
              style={styles.insightGradient}
            >
              <View style={styles.insightHeader}>
                <Text style={styles.insightEmoji}>{insight.icon}</Text>
                <Text style={styles.insightTitle}>{insight.title}</Text>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

export default AIInsightsSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  insightCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightGradient: {
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
});