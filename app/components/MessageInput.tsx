import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MentionInput from './MentionInput';
import ChatActions from './ChatActions';
import { useTheme } from '../context/ThemeContext';

interface MessageInputProps {
  message: string;
  onMessageChange: (text: string) => void;
  onSendPress: () => void;
  onSplitBillPress: () => void;
  onMediaSelect?: (media: {
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => void;
  selectedMedia?: {
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  } | null;
  onMediaSend?: () => void;
  onMediaCancel?: () => void;
  // Mention props
  groupId?: string;
  activeGroup?: any;
  isDirectChat?: boolean;
  otherUser?: any;
  onUserMention?: (user: any) => void;
  // Actions props
  showActions?: boolean;
}

export default function MessageInput({
  message,
  onMessageChange,
  onSendPress,
  onSplitBillPress,
  onMediaSelect,
  selectedMedia,
  onMediaSend,
  onMediaCancel,
  // Mention props
  groupId,
  activeGroup,
  isDirectChat = false,
  otherUser,
  onUserMention,
  // Actions props
  showActions = true,
}: MessageInputProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.inputContainer}>
      {selectedMedia && (
        <View style={styles.mediaPreview}>
          <View style={styles.mediaPreviewContent}>
            <Ionicons name="image" size={24} color={theme.primary} />
            <Text style={styles.mediaPreviewText}>
              {selectedMedia.fileName || `${selectedMedia.type} file`}
            </Text>
          </View>
          <View style={styles.mediaPreviewActions}>
            <TouchableOpacity
              style={[styles.mediaActionButton, styles.cancelButton]}
              onPress={onMediaCancel}
            >
              <Ionicons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaActionButton, styles.sendButton]}
              onPress={onMediaSend}
            >
              <Ionicons name="send" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.inputWrapper}>
        {showActions && onMediaSelect && (
          <ChatActions
            onMediaSelect={onMediaSelect}
            onSplitBillPress={onSplitBillPress}
            disabled={!!selectedMedia}
          />
        )}
        <MentionInput
          style={styles.textInput}
          value={message}
          onChangeText={onMessageChange}
          placeholder="Type @ to mention someone..."
          groupId={groupId}
          activeGroup={activeGroup}
          isDirectChat={isDirectChat}
          otherUser={otherUser}
          onUserMention={onUserMention}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!message.trim() && !selectedMedia) && styles.sendButtonDisabled]}
          onPress={selectedMedia ? onMediaSend : onSendPress}
          disabled={!message.trim() && !selectedMedia}
        >
          <Ionicons
            name="send"
            size={20}
            color={(message.trim() || selectedMedia) ? theme.surface : '#9CA3AF'}
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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12, // Extra padding for iOS safe area
  },
  mediaPreview: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mediaPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mediaPreviewText: {
    fontSize: 14,
    color: theme.text,
    marginLeft: 8,
    flex: 1,
  },
  mediaPreviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    maxHeight: 120, // Allow input to grow up to 120px
    borderWidth: 1,
    borderColor: theme.border,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    maxHeight: 120, // Increased to match inputWrapper maxHeight
    paddingVertical: 8,
    textAlignVertical: 'top', // Align text to top when multiline
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
  mediaIcon: {
    padding: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.border,
  },
});