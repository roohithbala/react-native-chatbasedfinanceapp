import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import WebRTC components conditionally
let RTCView: any = null;
try {
  const webrtcModule = require('react-native-webrtc');
  RTCView = webrtcModule.RTCView;
} catch (error) {
  console.warn('RTCView not available, video will not be displayed');
}

interface VideoCallStreamsProps {
  remoteStream: any;
  localStream: any;
  callStatus: string;
  participants: any[];
  isVideoOff: boolean;
  getDisplayName: () => string;
  getStatusText: () => string;
}

export default function VideoCallStreams({
  remoteStream,
  localStream,
  callStatus,
  participants,
  isVideoOff,
  getDisplayName,
  getStatusText,
}: VideoCallStreamsProps) {
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {remoteStream && RTCView ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={{ flex: 1, width: '100%', height: '100%' }}
            objectFit="cover"
            mirror={false}
          />
        ) : callStatus === 'connected' ? (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="videocam" size={80} color="rgba(255, 255, 255, 0.5)" />
            <Text style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: 16,
            }}>
              Video Call Active
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 8,
            }}>
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="person" size={80} color="rgba(255, 255, 255, 0.5)" />
            <Text style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: 16,
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
        )}
      </View>

      {/* Self Video */}
      {localStream && !isVideoOff && RTCView && (
        <View style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 120,
          height: 160,
          borderRadius: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderWidth: 2,
          borderColor: 'white',
        }}>
          <RTCView
            streamURL={localStream.toURL()}
            style={{ flex: 1, width: '100%', height: '100%', borderRadius: 12 }}
            objectFit="cover"
            mirror={true}
          />
        </View>
      )}
      {!localStream && callStatus === 'connected' && !isVideoOff && (
        <View style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 120,
          height: 160,
          borderRadius: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderWidth: 2,
          borderColor: 'white',
        }}>
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="person" size={30} color="rgba(255, 255, 255, 0.7)" />
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: 4,
            }}>
              You
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}