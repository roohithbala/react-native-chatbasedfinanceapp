import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface BudgetCardProps {
  category: string;
  budgetLimit: number;
  spentAmount: number;
  progressPercentage: number;
  progressColor: string;
  categoryIcon: string;
  categoryColors: [ColorValue, ColorValue];
  onPress?: () => void;
  showDetailsButton?: boolean;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  category,
  budgetLimit,
  spentAmount,
  progressPercentage,
  progressColor,
  categoryIcon,
  categoryColors,
  onPress,
  showDetailsButton = true,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const remaining = budgetLimit - spentAmount;

  return (
    <TouchableOpacity
      style={styles.budgetCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={categoryColors}
        style={styles.cardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.categoryInfo}>
            <View style={styles.categoryIcon}>
              <Text style={styles.categoryEmoji}>
                {categoryIcon}
              </Text>
            </View>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>{category}</Text>
              <Text style={styles.budgetRange}>
                {theme.currency}{spentAmount.toFixed(2)} of {theme.currency}{budgetLimit.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.budgetStatus}>
            <Text style={styles.progressPercentage}>
              {progressPercentage.toFixed(0)}%
            </Text>
            {showDetailsButton && (
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={onPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.cardBody, { backgroundColor: theme.surface }]}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, { color: theme.error || '#EF4444' }]}>
              {theme.currency}{spentAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[
              styles.statValue,
              { color: remaining >= 0 ? (theme.success || '#10B981') : (theme.error || '#EF4444') }
            ]}>
              {theme.currency}{remaining.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[progressColor, progressColor]}
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
        </View>

        {progressPercentage >= 90 && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color={theme.error || '#DC2626'} />
            <Text style={styles.warningText}>
              Approaching budget limit!
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default BudgetCard;

const getStyles = (theme: any) => StyleSheet.create({
  budgetCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  budgetRange: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  budgetStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  detailsButton: {
    padding: 4,
  },
  cardBody: {
    backgroundColor: theme.surface || 'white',
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary || '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.surfaceSecondary || '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: theme.error ? `${theme.error}20` : '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.error ? `${theme.error}40` : '#FECACA',
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: theme.error || '#DC2626',
    fontWeight: '600',
  },
});