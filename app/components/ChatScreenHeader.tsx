import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ChatScreenHeaderProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  onBackPress: () => void;
  onAvatarPress?: () => void;
  actions?: Array<{
    icon: string;
    onPress: () => void;
    key: string;
  }>;
}

export default function ChatScreenHeader({
  title,
  subtitle,
  avatar,
  onBackPress,
  onAvatarPress,
  actions = [],
}: ChatScreenHeaderProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <LinearGradient
      colors={['#6366F1', '#8B5CF6', '#EC4899']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.userInfo}
          onPress={onAvatarPress}
          disabled={!onAvatarPress}
        >
          {avatar && (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{avatar}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{title}</Text>
            {subtitle && <Text style={styles.userStatus}>{subtitle}</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.headerButton}
              onPress={action.onPress}
            >
              <Ionicons name={action.icon as any} size={20} color="white" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  userStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});