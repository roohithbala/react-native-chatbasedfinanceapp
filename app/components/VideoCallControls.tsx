import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoCallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  type: 'personal' | 'group';
  onMute: () => void;
  onVideoToggle: () => void;
  onSpeaker: () => void;
  onSwitchCamera: () => void;
  onAddCall: () => void;
  onEndCall: () => void;
}

export default function VideoCallControls({
  isMuted,
  isVideoOff,
  isSpeakerOn,
  type,
  onMute,
  onVideoToggle,
  onSpeaker,
  onSwitchCamera,
  onAddCall,
  onEndCall,
}: VideoCallControlsProps) {
  return (
    <>
      {/* Call Controls */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 40,
      }}>
        <TouchableOpacity
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: isMuted ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onMute}
        >
          <Ionicons
            name={isMuted ? "mic-off" : "mic"}
            size={24}
            color="white"
          />
          <Text style={{
            fontSize: 10,
            color: 'white',
            marginTop: 2,
            textAlign: 'center',
          }}>
            Mute
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: isVideoOff ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onVideoToggle}
        >
          <Ionicons
            name={isVideoOff ? "videocam-off" : "videocam"}
            size={24}
            color="white"
          />
          <Text style={{
            fontSize: 10,
            color: 'white',
            marginTop: 2,
            textAlign: 'center',
          }}>
            Video
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: isSpeakerOn ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onSpeaker}
        >
          <Ionicons
            name={isSpeakerOn ? "volume-high" : "volume-low"}
            size={24}
            color="white"
          />
          <Text style={{
            fontSize: 10,
            color: 'white',
            marginTop: 2,
            textAlign: 'center',
          }}>
            Speaker
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onSwitchCamera}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
          <Text style={{
            fontSize: 10,
            color: 'white',
            marginTop: 2,
            textAlign: 'center',
          }}>
            Switch
          </Text>
        </TouchableOpacity>

        {type === 'group' && (
          <TouchableOpacity
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={onAddCall}
          >
            <Ionicons name="person-add" size={24} color="white" />
            <Text style={{
              fontSize: 10,
              color: 'white',
              marginTop: 2,
              textAlign: 'center',
            }}>
              Add
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* End Call Button */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <TouchableOpacity
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: '#EF4444',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={onEndCall}
        >
          <Ionicons name="call-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );
}