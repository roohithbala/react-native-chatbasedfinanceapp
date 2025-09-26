import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocationMentionInput from './LocationMentionInput';
import { useTheme } from '../context/ThemeContext';

interface MessageInputProps {
  message: string;
  onMessageChange: (text: string) => void;
  onSendPress: () => void;
  onSplitBillPress: () => void;
}

export default function MessageInput({
  message,
  onMessageChange,
  onSendPress,
  onSplitBillPress,
}: MessageInputProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TouchableOpacity
          style={styles.moneyIcon}
          onPress={onSplitBillPress}
        >
          <Ionicons name="cash" size={20} color={theme.primary} />
        </TouchableOpacity>
        <LocationMentionInput
          style={styles.textInput}
          value={message}
          onChangeText={onMessageChange}
          placeholder="Type @ to mention someone or a location..."
          onLocationMention={(location) => {
            console.log('Location mentioned:', location);
            // Handle location mention - could show location preview or navigate to map
          }}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={onSendPress}
          disabled={!message.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={message.trim() ? theme.surface : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  inputContainer: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    maxHeight: 100,
    paddingVertical: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: theme.surfaceSecondary,
  },
  moneyIcon: {
    padding: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.border,
  },
});