import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface GroupChatHeaderProps {
  groupName?: string;
  activeGroup?: {
    name?: string;
    members?: any[];
  };
  connectionStatus: string;
  validGroupId?: string | null;
  onGroupManagementPress: () => void;
  onAddMemberPress: () => void;
}

export default function GroupChatHeader({
  groupName,
  activeGroup,
  connectionStatus,
  validGroupId,
  onGroupManagementPress,
  onAddMemberPress,
}: GroupChatHeaderProps) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 12,
            }}
            onPress={onGroupManagementPress}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}>
              <Ionicons name="people" size={24} color="white" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: 'white',
              }}>
                {groupName || activeGroup?.name || 'Group Chat'}
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: 2,
              }}>
                {activeGroup?.members?.length || 0} members • {connectionStatus === 'online' ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => router.push(`/group-stats?groupId=${validGroupId}&groupName=${encodeURIComponent(groupName || activeGroup?.name || 'Group Chat')}`)}
            >
              <Ionicons name="stats-chart" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => router.push(`/voice-call/${validGroupId}?type=group`)}
            >
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => router.push(`/video-call/${validGroupId}?type=group`)}
            >
              <Ionicons name="videocam" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={onAddMemberPress}
            >
              <Ionicons name="person-add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </>
  );
}