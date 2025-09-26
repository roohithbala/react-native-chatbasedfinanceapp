import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface HomeHeaderProps {
  userName: string;
  onTestConnectivity: () => void;
}

export default function HomeHeader({ userName, onTestConnectivity }: HomeHeaderProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={onTestConnectivity}
          >
            <Ionicons name="wifi" size={20} color={theme.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-circle" size={40} color={theme.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const getStyles = (theme: any) => StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: theme.surfaceSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.surface,
  },
  profileButton: {
    backgroundColor: theme.surface + '40', // 40% opacity
    borderRadius: 20,
    padding: 4,
  },
  debugButton: {
    backgroundColor: theme.primary,
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export { HomeHeader };