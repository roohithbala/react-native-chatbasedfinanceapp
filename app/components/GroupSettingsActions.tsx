import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface GroupSettingsActionsProps {
  groupId: string;
  onDeleteGroup: () => void;
}

export default function GroupSettingsActions({
  groupId,
  onDeleteGroup,
}: GroupSettingsActionsProps) {
  const { theme } = useTheme();

  return (
    <View>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
        onPress={() => {
          // Navigate to edit mode
          const { router } = require('expo-router');
          router.push(`/group-settings?groupId=${groupId}&mode=edit`);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
          <Ionicons name="pencil" size={20} color={theme.primary} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: theme.text }}>
            Edit Group Name
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
        onPress={() => {
          // Navigate to members mode
          const { router } = require('expo-router');
          router.push(`/group-settings?groupId=${groupId}&mode=members`);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
          <Ionicons name="people" size={20} color={theme.primary} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: theme.text }}>
            Manage Members
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
        onPress={onDeleteGroup}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
          <Ionicons name="trash" size={20} color={theme.error} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: theme.error }}>
            Delete Group
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.error} />
      </TouchableOpacity>
    </View>
  );
}