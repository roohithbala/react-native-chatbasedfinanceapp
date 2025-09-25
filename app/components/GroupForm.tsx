import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface GroupFormProps {
  groupName: string;
  groupDescription: string;
  selectedTemplateId: string | null;
  onGroupNameChange: (name: string) => void;
  onGroupDescriptionChange: (description: string) => void;
  isCreating: boolean;
}

export default function GroupForm({
  groupName,
  groupDescription,
  selectedTemplateId,
  onGroupNameChange,
  onGroupDescriptionChange,
  isCreating,
}: GroupFormProps) {
  return (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Group Name *</Text>
        <TextInput
          style={styles.textInput}
          value={groupName}
          onChangeText={onGroupNameChange}
          placeholder="Enter group name"
          placeholderTextColor="#94A3B8"
          maxLength={50}
          editable={!isCreating}
        />
        <Text style={styles.characterCount}>
          {groupName.length}/50
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Description {selectedTemplateId !== 'custom' ? '(Auto-filled)' : '(Optional)'}
        </Text>
        <TextInput
          style={[styles.textInput, styles.descriptionInput]}
          value={groupDescription}
          onChangeText={onGroupDescriptionChange}
          placeholder="Describe your group"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          maxLength={200}
          editable={!isCreating}
        />
        <Text style={styles.characterCount}>
          {groupDescription.length}/200
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
  },
});