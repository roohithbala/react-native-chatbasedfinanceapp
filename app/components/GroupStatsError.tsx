import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface GroupStatsErrorProps {
  type: 'invalid' | 'not-found';
  onBack?: () => void;
  onGoToChats?: () => void;
}

export default function GroupStatsError({
  type,
  onBack,
  onGoToChats,
}: GroupStatsErrorProps) {
  const { theme } = useTheme();

  if (type === 'invalid') {
    return (
      <View style={{ flex: 1 }}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              padding: 8,
              borderRadius: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <Ionicons name="alert-circle" size={64} color={theme.error} />
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginTop: 16,
            marginBottom: 8,
            color: theme.text,
          }}>
            Invalid Group
          </Text>
          <Text style={{
            fontSize: 16,
            textAlign: 'center',
            lineHeight: 22,
            color: theme.textSecondary,
          }}>
            No group ID provided. Please go back and try again.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            padding: 8,
            borderRadius: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      )}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Ionicons name="alert-circle" size={64} color={theme.error} />
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginTop: 16,
          marginBottom: 8,
          color: theme.text,
        }}>
          Group Not Found
        </Text>
        <Text style={{
          fontSize: 16,
          textAlign: 'center',
          lineHeight: 22,
          color: theme.textSecondary,
        }}>
          This group no longer exists or you don't have access to it.
        </Text>
        {onGoToChats && (
          <TouchableOpacity
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: theme.primary,
            }}
            onPress={onGoToChats}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.surface,
            }}>
              Go to Chats
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}