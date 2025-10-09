import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface UserProfileHeaderProps {
  onBack: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
}

export default function UserProfileHeader({
  onBack,
  onVoiceCall,
  onVideoCall,
}: UserProfileHeaderProps) {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={[theme.primary, '#8B5CF6', '#EC4899']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 20,
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <TouchableOpacity
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={onVoiceCall}
          >
            <Ionicons name="call" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={onVideoCall}
          >
            <Ionicons name="videocam" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}