import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Group Name *</Text>
        <TextInput
          style={styles.textInput}
          value={groupName}
          onChangeText={onGroupNameChange}
          placeholder="Enter group name"
          placeholderTextColor={theme.textSecondary}
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
          placeholderTextColor={theme.textSecondary}
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

const getStyles = (theme: any) => StyleSheet.create({
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
});