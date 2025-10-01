import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { callService, CallData, CallParticipant } from '../../lib/services/callService';
import { useCallStore } from '../../lib/store/callStore';
import { useFinanceStore } from '../../lib/store/financeStore';
import socketService from '../../lib/services/socketService';

const { width, height } = Dimensions.get('window');

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
      Alert.alert('Error', 'Failed to start call. Please check your connection and try again.');
      router.back();
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-down" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Call Info */}
          <View style={styles.callInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={60} color="white" />
            </View>
            <Text style={styles.callTitle}>{getDisplayName()}</Text>
            <Text style={styles.callStatus}>{getStatusText()}</Text>
            {type === 'group' && participants.length > 0 && (
              <Text style={styles.participantCount}>
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Call Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={handleMute}
            >
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={24}
                color="white"
              />
              <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
              onPress={handleSpeaker}
            >
              <Ionicons
                name={isSpeakerOn ? "volume-high" : "volume-medium"}
                size={24}
                color="white"
              />
              <Text style={styles.controlText}>Speaker</Text>
            </TouchableOpacity>

            {type === 'group' && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleAddCall}
              >
                <Ionicons name="person-add" size={24} color="white" />
                <Text style={styles.controlText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* End Call Button */}
          <View style={styles.endCallContainer}>
            <TouchableOpacity
              style={styles.endCallButton}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  callTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  callStatus: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 60,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  controlText: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
    textAlign: 'center',
  },
  participantCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
  endCallContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});