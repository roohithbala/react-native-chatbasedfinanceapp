import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, Platform, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';

interface ChatActionsProps {
  onMediaSelect: (media: {
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => void;
  onSplitBillPress: () => void;
  disabled?: boolean;
}

export default function ChatActions({
  onMediaSelect,
  onSplitBillPress,
  disabled = false,
}: ChatActionsProps) {
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
    if (disabled) return;
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelect({
        uri: asset.uri,
        type: 'image',
        fileName: asset.fileName || `image-${Date.now()}.jpg`,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const takePhoto = async () => {
    if (disabled) return;
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
      onMediaSelect({
        uri: asset.uri,
        type: 'image',
        fileName: asset.fileName || `photo-${Date.now()}.jpg`,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const pickVideo = async () => {
    if (disabled) return;
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelect({
        uri: asset.uri,
        type: 'video',
        fileName: asset.fileName || `video-${Date.now()}.mp4`,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType || 'video/mp4',
      });
    }
  };

  const recordVideo = async () => {
    if (disabled) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to record videos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'videos',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelect({
        uri: asset.uri,
        type: 'video',
        fileName: asset.fileName || `video-${Date.now()}.mp4`,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType || 'video/mp4',
      });
    }
  };

  const pickDocument = async () => {
    if (disabled) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        onMediaSelect({
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
    if (disabled) return;
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
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
        onPress={onSplitBillPress}
        disabled={disabled}
      >
        <Ionicons name="cash" size={20} color={disabled ? theme.textSecondary : theme.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
        onPress={showMediaOptions}
        disabled={disabled}
      >
        <Ionicons name="attach" size={20} color={disabled ? theme.textSecondary : theme.primary} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: theme.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});