import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceCallHeaderProps {
  onBack: () => void;
}

export default function VoiceCallHeader({ onBack }: VoiceCallHeaderProps) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'flex-start',
      paddingTop: 20,
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
        onPress={onBack}
      >
        <Ionicons name="chevron-down" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}