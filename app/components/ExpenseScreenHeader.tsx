import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface ExpenseScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showReloadButton?: boolean;
  onReload?: () => void;
  variant?: 'gradient' | 'surface';
  rightElement?: React.ReactNode;
}

export default function ExpenseScreenHeader({
  title,
  subtitle,
  showBackButton = true,
  showReloadButton = false,
  onReload,
  variant = 'gradient',
  rightElement
}: ExpenseScreenHeaderProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const HeaderContent = () => (
    <>
      <View style={styles.headerTop}>
        {showBackButton && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={variant === 'gradient' ? 'white' : theme.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={[
            styles.headerTitle,
            { color: variant === 'gradient' ? 'white' : theme.text }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[
              styles.headerSubtitle,
              { color: variant === 'gradient' ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary }
            ]}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {showReloadButton && onReload && (
            <TouchableOpacity style={styles.reloadButton} onPress={onReload}>
              <Ionicons
                name="refresh"
                size={20}
                color={variant === 'gradient' ? 'white' : theme.text}
              />
            </TouchableOpacity>
          )}
          {rightElement}
          {!showReloadButton && !rightElement && <View style={styles.placeholder} />}
        </View>
      </View>
    </>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.gradientHeader}>
        <HeaderContent />
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.surfaceHeader, {
      backgroundColor: theme.surface,
      borderBottomColor: theme.border
    }]}>
      <HeaderContent />
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  gradientHeader: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  surfaceHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  placeholder: {
    width: 40,
  },
});