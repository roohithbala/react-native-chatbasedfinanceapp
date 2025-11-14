import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, hexToRgba } from '../context/ThemeContext';

interface HomeHeaderProps {
  userName: string;
  onTestConnectivity: () => void;
}

export default function HomeHeader({ userName, onTestConnectivity }: HomeHeaderProps) {
  const { theme } = useTheme();

  if (!theme) {
    return (
      <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 24, backgroundColor: '#2563EB' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 16, color: '#FFFFFF', marginBottom: 4 }}>Good {getTimeOfDay()},</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>{userName}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#2563EB', padding: 8, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
              onPress={onTestConnectivity}
            >
              <Ionicons name="wifi" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#FFFFFF40', borderRadius: 20, padding: 4 }}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person-circle" size={40} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const styles = getStyles(theme);
  return (
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
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
    </View>
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
    backgroundColor: hexToRgba(theme.surface, 0.4), // 40% opacity
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