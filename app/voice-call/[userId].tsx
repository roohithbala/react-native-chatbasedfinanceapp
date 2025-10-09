import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { callService, CallData, CallParticipant } from '../../lib/services/callService';
import { useCallStore } from '../../lib/store/callStore';
import { useFinanceStore } from '../../lib/store/financeStore';
import socketService from '../../lib/services/socketService';
import VoiceCallHeader from '../components/VoiceCallHeader';
import VoiceCallInfo from '../components/VoiceCallInfo';
import VoiceCallControls from '../components/VoiceCallControls';
import { voiceCallStyles } from '@/lib/styles/voiceCallStyles';

export default function VoiceCallScreen() {
  const { userId, groupId, type = 'personal' } = useLocalSearchParams<{
    userId?: string;
    groupId?: string;
    type?: 'personal' | 'group';
  }>();
  const { theme } = useTheme();
  const { currentUser } = useFinanceStore();
  const callStore = useCallStore();

  const [callDuration, setCallDuration] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get call data from store
  const currentCall = callStore.currentCall;
  const callStatus = callStore.callStatus;
  const participants = callStore.participants;
  const isMuted = callStore.isMuted;
  const isSpeakerOn = callStore.isSpeakerOn;

  useEffect(() => {
    initializeCall();
    setupCallEventHandlers();

    return () => {
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      startDurationTimer();
    } else {
      stopDurationTimer();
    }

    return () => stopDurationTimer();
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      setIsInitializing(true);

      // Check if socket is connected
      const socketStatus = socketService.getConnectionStatus();
      if (!socketStatus.isConnected) {
        console.warn('Socket not connected, attempting to connect...');
        await socketService.connect();
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Set up call event handlers
      callService.setEventCallbacks({
        onCallReceived: (callData) => {
          callStore.setIncomingCall(callData);
        },
        onCallAccepted: (callData) => {
          callStore.setCurrentCall(callData);
          callStore.setCallStatus('connected');
        },
        onCallEnded: (callData) => {
          callStore.endCall();
          router.back();
        },
        onParticipantJoined: (participant) => {
          callStore.addParticipant(participant);
        },
        onParticipantLeft: (participantId) => {
          callStore.removeParticipant(participantId);
        }
      });

      // Check if there's an incoming call to answer
      const incomingCall = callStore.incomingCall;
      if (incomingCall && incomingCall.callerId === userId) {
        console.log('Answering incoming call:', incomingCall.callId);
        await callService.answerCall();
        callStore.setCurrentCall(incomingCall);
        callStore.setIncomingCall(null);
        return;
      }

      // If this is an outgoing call, start it
      if (userId && !groupId) {
        const participants = [userId];
        const callData = await callService.startCall(participants, 'voice');
        callStore.startCall(callData);
      } else if (groupId) {
        // For group calls, we'd need to get group members
        // For now, just show connecting state
        callStore.setCallStatus('connecting');
      }

    } catch (error) {
      console.error('Failed to initialize call:', error);
      
      let errorMessage = 'Failed to start call. Please try again.';
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Permissions not granted')) {
          errorMessage = '⚠️ Voice calls require microphone permissions.\n\n' +
            'This feature needs a development build. Please run:\n\n' +
            '1. npx expo prebuild --clean\n' +
            '2. npx expo run:android (or run:ios)\n\n' +
            'Expo Go does not support expo-camera/expo-av permissions.';
        } else if (error.message.includes('not available')) {
          errorMessage = 'Voice call feature is not available. Please ensure the app is properly configured.';
        } else if (error.message.includes('Socket')) {
          errorMessage = 'Unable to connect to call service. Please check your internet connection.';
        }
      }
      
      Alert.alert('Call Failed', errorMessage, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setIsInitializing(false);
    }
  };

  const setupCallEventHandlers = () => {
    // Additional setup if needed
  };

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const cleanupCall = () => {
    stopDurationTimer();
    if (callStore.isInCall) {
      callService.endCall();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    callService.endCall();
    callStore.endCall();
    router.back();
  };

  const handleMute = () => {
    const newMutedState = callService.toggleMute();
    callStore.setMuted(newMutedState);
  };

  const handleSpeaker = () => {
    const newSpeakerState = callService.toggleSpeaker();
    callStore.setSpeakerOn(newSpeakerState);
  };

  const handleAddCall = () => {
    if (type === 'group') {
      Alert.alert('Add Participant', 'Add participant functionality coming soon!');
    } else {
      Alert.alert('Add Call', 'This feature is only available in group calls');
    }
  };

  const getDisplayName = () => {
    if (type === 'group') {
      return 'Group Call';
    }
    return 'Voice Call';
  };

  const getStatusText = () => {
    if (isInitializing) return 'Initializing...';

    switch (callStatus) {
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      default:
        return 'Calling...';
    }
  };

  const getParticipantCount = () => {
    return participants.length;
  };

  return (
    <SafeAreaView style={voiceCallStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={voiceCallStyles.background}
      >
        <View style={voiceCallStyles.content}>
          <VoiceCallHeader onBack={() => router.back()} />

          <VoiceCallInfo
            getDisplayName={getDisplayName}
            getStatusText={getStatusText}
            type={type}
            participants={participants}
          />

          <VoiceCallControls
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
            onToggleMute={handleMute}
            onToggleSpeaker={handleSpeaker}
            onEndCall={handleEndCall}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

