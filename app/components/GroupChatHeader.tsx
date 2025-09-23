import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface GroupChatHeaderProps {
  groupName?: string;
  activeGroup?: any;
  memberCount?: number;
  connectionStatus: 'online' | 'offline' | 'connecting';
  onAddMemberPress: () => void;
}

export default function GroupChatHeader({
  groupName,
  activeGroup,
  memberCount,
  connectionStatus,
  onAddMemberPress,
}: GroupChatHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#2563EB" />
        </TouchableOpacity>

        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>
            {groupName || (activeGroup?.name) || 'Group Chat'}
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.memberCount}>
              {memberCount || activeGroup?.members?.length || 0} members
            </Text>
            <View style={styles.connectionIndicator}>
              <View style={[
                styles.connectionDot,
                connectionStatus === 'online' && styles.connectionDotOnline,
                connectionStatus === 'connecting' && styles.connectionDotConnecting,
                connectionStatus === 'offline' && styles.connectionDotOffline
              ]} />
              <Text style={styles.connectionText}>
                {connectionStatus === 'online' ? 'Online' :
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onAddMemberPress}
          >
            <Ionicons name="person-add" size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  memberCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionDotOnline: {
    backgroundColor: '#10B981',
  },
  connectionDotConnecting: {
    backgroundColor: '#F59E0B',
  },
  connectionDotOffline: {
    backgroundColor: '#EF4444',
  },
  connectionText: {
    fontSize: 12,
    color: '#6B7280',
  },
});