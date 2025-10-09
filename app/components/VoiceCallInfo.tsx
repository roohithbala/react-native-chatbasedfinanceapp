import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceCallInfoProps {
  getDisplayName: () => string;
  getStatusText: () => string;
  type: 'personal' | 'group';
  participants: any[];
}

export default function VoiceCallInfo({
  getDisplayName,
  getStatusText,
  type,
  participants,
}: VoiceCallInfoProps) {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <Ionicons name="person" size={60} color="white" />
      </View>
      <Text style={{
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        {getDisplayName()}
      </Text>
      <Text style={{
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
      }}>
        {getStatusText()}
      </Text>
      {type === 'group' && participants.length > 0 && (
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.6)',
          marginTop: 4,
          textAlign: 'center',
        }}>
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}