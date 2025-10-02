import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useFinanceStore } from '../../lib/store/financeStore';
import { usersAPI } from '../../lib/services/api';

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  lastSeen?: string;
  groups?: Array<{
    _id: string;
    name: string;
    avatar?: string;
  }>;
  createdAt: string;
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { theme } = useTheme();
  const { currentUser } = useFinanceStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      // If viewing own profile, redirect to main profile
      if (userId === currentUser?._id) {
        router.replace('/profile');
        return;
      }

      // Fetch real user profile data from API
      const userData = await usersAPI.getUser(userId);
      setUserProfile(userData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
      setIsLoading(false);
    }
  };

  const handleStartChat = () => {
    router.push(`/chat/${userId}`);
  };

  const handleVoiceCall = () => {
    router.push(`/voice-call/${userId}?type=personal`);
  };

  const handleVideoCall = () => {
    router.push(`/video-call/${userId}?type=personal`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.text }]}>User not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.surface }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleVoiceCall}>
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleVideoCall}>
              <Ionicons name="videocam" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {userProfile.avatar || userProfile.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {userProfile.name}
            </Text>
            <Text style={[styles.userUsername, { color: theme.textSecondary }]}>
              @{userProfile.username}
            </Text>
          </View>

          {userProfile.bio && (
            <Text style={[styles.userBio, { color: theme.text }]}>
              {userProfile.bio}
            </Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>{userProfile.groups?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Groups</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Expenses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Split Bills</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleStartChat}
          >
            <Ionicons name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>

          <View style={[styles.detailItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              {userProfile.email || 'Not provided'}
            </Text>
          </View>

          <View style={[styles.detailItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              {userProfile.lastSeen ? `Last seen ${new Date(userProfile.lastSeen).toLocaleDateString()}` : 'Online'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
  },
  userBio: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  actionSection: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});