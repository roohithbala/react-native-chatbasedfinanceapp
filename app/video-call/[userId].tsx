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
        errorMessage = 'Camera and microphone permissions are required for video calls. Please grant permissions and try again.';
        errorTitle = 'Permissions Required';
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
          <View style={styles.videoContainer}>
            <View style={styles.mainVideo}>
              {remoteStream && RTCView ? (
                <RTCView
                  streamURL={remoteStream.toURL()}
                  style={styles.videoStream}
                  objectFit="cover"
                  mirror={false}
                />
              ) : callStatus === 'connected' ? (
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="videocam" size={80} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.videoText}>Video Call Active</Text>
                  <Text style={styles.participantsText}>
                    {participants.length} participant{participants.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="person" size={80} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.videoText}>{getDisplayName()}</Text>
                  <Text style={styles.callStatus}>{getStatusText()}</Text>
                </View>
              )}
            </View>

            {/* Self Video */}
            {localStream && !isVideoOff && RTCView && (
              <View style={styles.selfVideo}>
                <RTCView
                  streamURL={localStream.toURL()}
                  style={styles.selfVideoStream}
                  objectFit="cover"
                  mirror={true}
                />
              </View>
            )}
            {!localStream && callStatus === 'connected' && !isVideoOff && (
              <View style={styles.selfVideo}>
                <View style={styles.selfVideoPlaceholder}>
                  <Ionicons name="person" size={30} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.selfVideoText}>You</Text>
                </View>
              </View>
            )}
          </View>

          {/* Call Info */}
          <View style={styles.callInfo}>
            <Text style={styles.callTitle}>{getDisplayName()}</Text>
            <Text style={styles.callStatus}>{getStatusText()}</Text>
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
              <Text style={styles.controlText}>Mute</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={handleVideoToggle}
            >
              <Ionicons
                name={isVideoOff ? "videocam-off" : "videocam"}
                size={24}
                color="white"
              />
              <Text style={styles.controlText}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
              onPress={handleSpeaker}
            >
              <Ionicons
                name={isSpeakerOn ? "volume-high" : "volume-low"}
                size={24}
                color="white"
              />
              <Text style={styles.controlText}>Speaker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleSwitchCamera}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
              <Text style={styles.controlText}>Switch</Text>
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
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  mainVideo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoStream: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    alignItems: 'center',
  },
  videoText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  selfVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: 'white',
  },
  selfVideoStream: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  selfVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfVideoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  participantsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  callInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  callTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  callStatus: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  controlText: {
    fontSize: 10,
    color: 'white',
    marginTop: 2,
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