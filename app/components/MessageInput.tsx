import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform, Text, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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
  isSending?: boolean;
  error?: string | null;
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
  isSending = false,
  error = null,
}: MessageInputProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Media library access is required to select files.');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelect?.({
        uri: asset.uri,
        type: 'image',
        fileName: asset.fileName || `image-${Date.now()}.jpg`,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelect?.({
        uri: asset.uri,
        type: 'image',
        fileName: asset.fileName || `photo-${Date.now()}.jpg`,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const pickVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelect?.({
        uri: asset.uri,
        type: 'video',
        fileName: asset.fileName || `video-${Date.now()}.mp4`,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType || 'video/mp4',
      });
    }
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to record videos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelect?.({
        uri: asset.uri,
        type: 'video',
        fileName: asset.fileName || `video-${Date.now()}.mp4`,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType || 'video/mp4',
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        onMediaSelect?.({
          uri: asset.uri,
          type: 'document',
          fileName: asset.name,
          fileSize: asset.size,
          mimeType: asset.mimeType || 'application/octet-stream',
        });
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Select Media',
      'Choose media type to send',
      [
        { text: 'Photo from Gallery', onPress: pickImage },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Video from Gallery', onPress: pickVideo },
        { text: 'Record Video', onPress: recordVideo },
        { text: 'Document', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };
  return (
    <View style={styles.inputContainer} pointerEvents="auto">
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
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
      <View style={styles.inputWrapper} pointerEvents="auto">
        <TouchableOpacity
          style={styles.moneyIcon}
          onPress={onSplitBillPress}
        >
          <Ionicons name="cash" size={20} color={theme.primary} />
        </TouchableOpacity>
        {onMediaSelect && !selectedMedia && (
          <TouchableOpacity
            style={styles.mediaIcon}
            onPress={showMediaOptions}
          >
            <Ionicons name="attach" size={20} color={theme.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.textInputContainer}>
          <TextInput
            style={[styles.textInput, { pointerEvents: 'auto' }]}
            value={message}
            onChangeText={onMessageChange}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            multiline
            editable={true}
            autoCapitalize="sentences"
            autoCorrect={true}
            keyboardType="default"
            returnKeyType="send"
            blurOnSubmit={false}
            pointerEvents="auto"
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, (!message.trim() && !selectedMedia) || isSending ? styles.sendButtonDisabled : null]}
          onPress={selectedMedia ? onMediaSend : onSendPress}
          disabled={(!message.trim() && !selectedMedia) || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={theme.surface} />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={(message.trim() || selectedMedia) && !isSending ? theme.surface : '#9CA3AF'}
            />
          )}
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.error ? `${theme.error}15` : '#FEF2F2',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.error ? `${theme.error}30` : '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: theme.error || '#DC2626',
    marginLeft: 8,
    flex: 1,
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
    backgroundColor: theme.error ? `${theme.error}15` : '#FEF2F2',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    maxHeight: 120, // Allow input to grow up to 120px
    borderWidth: 1,
    borderColor: theme.border,
  },
  textInputContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Align to top instead of center
    minHeight: 40,
    maxHeight: 100, // Allow text input to grow
    backgroundColor: 'transparent', // Ensure transparent background
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    maxHeight: 100, // Allow vertical growth
    paddingVertical: 8,
    textAlignVertical: 'top', // Align text to top when multiline
    backgroundColor: 'transparent', // Ensure transparent background
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