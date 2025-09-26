import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
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
            <Ionicons name="person-add" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  header: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  memberCount: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.success,
  },
  connectionDotConnecting: {
    backgroundColor: theme.warning,
  },
  connectionDotOffline: {
    backgroundColor: theme.error,
  },
  connectionText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
});