import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface GroupNameEditorProps {
  group: any;
  groupName: string;
  isEditing: boolean;
  isOwner: boolean;
  onGroupNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
}

export default function GroupNameEditor({
  group,
  groupName,
  isEditing,
  isOwner,
  onGroupNameChange,
  onSave,
  onCancel,
  onStartEdit,
}: GroupNameEditorProps) {
  const { theme } = useTheme();

  return (
    <View style={{ marginTop: 8 }}>
      {isEditing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 16,
              backgroundColor: theme.background,
              color: theme.text,
              borderColor: theme.border,
            }}
            value={groupName}
            onChangeText={onGroupNameChange}
            placeholder="Enter group name"
            placeholderTextColor={theme.textSecondary}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ padding: 8, borderRadius: 6, backgroundColor: theme.primary }}
              onPress={onSave}
            >
              <Ionicons name="checkmark" size={16} color={theme.background} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 8, borderRadius: 6, backgroundColor: theme.error }}
              onPress={onCancel}
            >
              <Ionicons name="close" size={16} color={theme.background} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '500', flex: 1, color: theme.text }}>
            {groupName}
          </Text>
          {isOwner && (
            <TouchableOpacity
              style={{ padding: 8, borderRadius: 6, backgroundColor: theme.primary }}
              onPress={onStartEdit}
            >
              <Ionicons name="pencil" size={16} color={theme.background} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}