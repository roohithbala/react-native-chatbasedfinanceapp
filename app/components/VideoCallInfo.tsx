import React from 'react';
import { View, Text } from 'react-native';

interface VideoCallInfoProps {
  getDisplayName: () => string;
  getStatusText: () => string;
}

export default function VideoCallInfo({
  getDisplayName,
  getStatusText,
}: VideoCallInfoProps) {
  return (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 16,
      alignItems: 'center',
    }}>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
      }}>
        {getDisplayName()}
      </Text>
      <Text style={{
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
      }}>
        {getStatusText()}
      </Text>
    </View>
  );
}