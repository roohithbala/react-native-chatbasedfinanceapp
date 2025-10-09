import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voiceCallStyles } from '@/lib/styles/voiceCallStyles';

interface VoiceCallControlsProps {
  isMuted: boolean;
  isSpeakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
}

export default function VoiceCallControls({
  isMuted,
  isSpeakerOn,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
}: VoiceCallControlsProps) {
  return (
    <View style={voiceCallStyles.controlsContainer}>
      <TouchableOpacity
        onPress={onToggleMute}
        style={[
          voiceCallStyles.controlButton,
          isMuted ? voiceCallStyles.controlButtonMuted : voiceCallStyles.controlButtonInactive,
        ]}
      >
        <Ionicons
          name={isMuted ? 'mic-off' : 'mic'}
          size={24}
          color="white"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleSpeaker}
        style={[
          voiceCallStyles.controlButton,
          isSpeakerOn ? voiceCallStyles.controlButtonSpeaker : voiceCallStyles.controlButtonInactive,
        ]}
      >
        <Ionicons
          name={isSpeakerOn ? 'volume-high' : 'volume-low'}
          size={24}
          color="white"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onEndCall}
        style={voiceCallStyles.endCallButton}
      >
        <Ionicons name="call-outline" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}