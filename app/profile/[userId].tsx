import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useFinanceStore } from '../../lib/store/financeStore';
import { usersAPI } from '../../lib/services/api';
import UserProfileHeader from '../components/UserProfileHeader';
import UserProfileInfo from '../components/UserProfileInfo';
import UserProfileActions from '../components/UserProfileActions';
import { profileStyles } from '@/lib/styles/profileStyles';

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
      <View style={[profileStyles.container, profileStyles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[profileStyles.container, { backgroundColor: theme.background }]}>
        <View style={profileStyles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={theme.textSecondary} />
          <Text style={[profileStyles.errorText, { color: theme.text }]}>User not found</Text>
          <TouchableOpacity
            style={[profileStyles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[profileStyles.backButtonText, { color: theme.surface }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[profileStyles.container, { backgroundColor: theme.background }]}>
      <UserProfileHeader
        onBack={() => router.back()}
        onVoiceCall={handleVoiceCall}
        onVideoCall={handleVideoCall}
      />

      <ScrollView style={profileStyles.content} showsVerticalScrollIndicator={false}>
        <UserProfileInfo userProfile={userProfile} />

        <UserProfileActions
          userProfile={userProfile}
          onStartChat={handleStartChat}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

