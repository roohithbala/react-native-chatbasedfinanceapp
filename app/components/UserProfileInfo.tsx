import React from 'react';
import { View, Text } from 'react-native';
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
  groups?: {
    _id: string;
    name: string;
    avatar?: string;
  }[];
  createdAt: string;
}

interface UserProfileInfoProps {
  userProfile: UserProfile;
}

export default function UserProfileInfo({ userProfile }: UserProfileInfoProps) {
  const { theme } = useTheme();

  return (
    <View style={{
      alignItems: 'center',
      marginBottom: 32,
    }}>
      <View style={{
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
        backgroundColor: theme.primary,
      }}>
        <Text style={{
          fontSize: 48,
          fontWeight: 'bold',
          color: 'white',
        }}>
          {userProfile.avatar || userProfile.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 4,
          color: theme.text,
        }}>
          {userProfile.name}
        </Text>
        <Text style={{
          fontSize: 16,
          color: theme.textSecondary,
        }}>
          @{userProfile.username}
        </Text>
      </View>

      {userProfile.bio && (
        <Text style={{
          fontSize: 16,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 24,
          paddingHorizontal: 20,
          color: theme.text,
        }}>
          {userProfile.bio}
        </Text>
      )}

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 24,
      }}>
        <View style={{
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 4,
            color: theme.primary,
          }}>
            {userProfile.groups?.length || 0}
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary,
          }}>
            Groups
          </Text>
        </View>
        <View style={{
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 4,
            color: theme.primary,
          }}>
            0
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary,
          }}>
            Expenses
          </Text>
        </View>
        <View style={{
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 4,
            color: theme.primary,
          }}>
            0
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary,
          }}>
            Split Bills
          </Text>
        </View>
      </View>
    </View>
  );
}