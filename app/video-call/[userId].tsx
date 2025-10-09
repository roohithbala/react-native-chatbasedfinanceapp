import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
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
import VideoCallStreams from '../components/VideoCallStreams';
import VideoCallInfo from '../components/VideoCallInfo';
import VideoCallControls from '../components/VideoCallControls';
import { getStyles } from '@/lib/styles/videoCallStyles';

// Import WebRTC components conditionally
let RTCView: any = null;
try {
  const webrtcModule = require('react-native-webrtc');
  RTCView = webrtcModule.RTCView;
} catch (error) {
  console.warn('RTCView not available, video will not be displayed');
}

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen() {
  const { userId, groupId, type = 'personal' } = useLocalSearchParams<{
    userId?: string;
    groupId?: string;
    type?: 'personal' | 'group';
  }>();
  const { theme } = useTheme();
  const styles = getStyles();
  const { currentUser } = useFinanceStore();
  const callStore = useCallStore();

  const [callDuration, setCallDuration] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Video streams
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);

  // Get call data from store
  const currentCall = callStore.currentCall;
  const callStatus = callStore.callStatus;
  const participants = callStore.participants;
  const isMuted = callStore.isMuted;
  const isVideoOff = callStore.isVideoOff;
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
          setLocalStream(null);
          setRemoteStream(null);
          router.back();
        },
        onParticipantJoined: (participant) => {
          callStore.addParticipant(participant);
        },
        onParticipantLeft: (participantId) => {
          callStore.removeParticipant(participantId);
        },
        onStreamReceived: (participantId, stream) => {
          // Handle remote video stream
          console.log('Remote video stream received:', participantId);
          setRemoteStream(stream);
        }
      });

      // Get local stream if available
      const localStreamData = callService.getLocalStream();
      if (localStreamData) {
        setLocalStream(localStreamData);
      }

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
        const callData = await callService.startCall(participants, 'video');
        callStore.startCall(callData);
      } else if (groupId) {
        // For group calls, we'd need to get group members
        callStore.setCallStatus('connecting');
      }

    } catch (error: any) {
      console.error('Failed to initialize video call:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to start video call.';
      let errorTitle = 'Call Error';
      
      if (error.message?.includes('Permissions not granted')) {
        errorMessage = '⚠️ Video calls require camera and microphone permissions.\n\n' +
          'This feature needs a development build. Please run:\n\n' +
          '1. npx expo prebuild --clean\n' +
          '2. npx expo run:android (or run:ios)\n\n' +
          'Expo Go does not support expo-camera/expo-av permissions.';
        errorTitle = 'Development Build Required';
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        errorTitle = 'Connection Error';
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      Alert.alert(errorTitle, errorMessage);
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
    setLocalStream(null);
    setRemoteStream(null);
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

  const handleVideoToggle = () => {
    const newVideoState = callService.toggleVideo();
    callStore.setVideoOff(newVideoState);
  };

  const handleSpeaker = () => {
    const newSpeakerState = callService.toggleSpeaker();
    callStore.setSpeakerOn(newSpeakerState);
  };

  const handleSwitchCamera = async () => {
    const success = await callService.switchCamera();
    if (!success) {
      Alert.alert('Camera Switch', 'Failed to switch camera. Please try again.');
    }
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
      return 'Group Video Call';
    }
    return 'Video Call';
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
          {/* Video Area */}
          <VideoCallStreams
            remoteStream={remoteStream}
            localStream={localStream}
            callStatus={callStatus}
            participants={participants}
            isVideoOff={isVideoOff}
            getDisplayName={getDisplayName}
            getStatusText={getStatusText}
          />

          {/* Call Info */}
          <VideoCallInfo
            getDisplayName={getDisplayName}
            getStatusText={getStatusText}
          />

          {/* Call Controls */}
          <VideoCallControls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isSpeakerOn={isSpeakerOn}
            type={type}
            onMute={handleMute}
            onVideoToggle={handleVideoToggle}
            onSpeaker={handleSpeaker}
            onSwitchCamera={handleSwitchCamera}
            onAddCall={handleAddCall}
            onEndCall={handleEndCall}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}