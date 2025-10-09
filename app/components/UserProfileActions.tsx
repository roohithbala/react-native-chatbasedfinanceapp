import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

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

interface UserProfileActionsProps {
  userProfile: UserProfile;
  onStartChat: () => void;
}

export default function UserProfileActions({ userProfile, onStartChat }: UserProfileActionsProps) {
  const { theme } = useTheme();

  return (
    <View>
      <View style={{
        marginBottom: 32,
      }}>
        <TouchableOpacity
          style={{
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
            backgroundColor: theme.primary,
          }}
          onPress={onStartChat}
        >
          <Ionicons name="chatbubble-outline" size={20} color="white" />
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: 'white',
            marginLeft: 8,
          }}>
            Send Message
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{
        marginBottom: 20,
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: 16,
          color: theme.text,
        }}>
          Details
        </Text>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          marginBottom: 12,
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}>
          <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
          <Text style={{
            fontSize: 16,
            marginLeft: 12,
            flex: 1,
            color: theme.text,
          }}>
            {userProfile.email || 'Not provided'}
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          marginBottom: 12,
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}>
          <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
          <Text style={{
            fontSize: 16,
            marginLeft: 12,
            flex: 1,
            color: theme.text,
          }}>
            {userProfile.lastSeen ? `Last seen ${new Date(userProfile.lastSeen).toLocaleDateString()}` : 'Online'}
          </Text>
        </View>
      </View>
    </View>
  );
}