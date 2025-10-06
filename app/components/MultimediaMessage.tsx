import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface MultimediaMessageProps {
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaSize?: number;
  mediaDuration?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  text?: string;
  isOwnMessage: boolean;
  onMediaPress?: (mediaUrl: string, mediaType: string) => void;
  theme: any;
}

export const MultimediaMessage: React.FC<MultimediaMessageProps> = ({
  mediaUrl,
  mediaType,
  mediaSize,
  mediaDuration,
  mediaWidth,
  mediaHeight,
  thumbnailUrl,
  fileName,
  text,
  isOwnMessage,
  onMediaPress,
  theme,
}) => {
  const styles = getStyles(theme);

  if (!mediaUrl || !mediaType) return null;

  const { width: screenWidth } = Dimensions.get('window');
  const maxWidth = screenWidth * 0.7;
  const maxHeight = 300;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  switch (mediaType) {
    case 'image':
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(mediaUrl, mediaType)}
          style={styles.mediaContainer}
        >
          <Image
            source={{ uri: mediaUrl }}
            style={[
              styles.mediaImage,
              {
                width: mediaWidth && mediaWidth < maxWidth ? mediaWidth : maxWidth,
                height: mediaHeight ? Math.min(mediaHeight, maxHeight) : 200,
              }
            ]}
            resizeMode="cover"
          />
          {text && text.trim() && (
            <Text style={[
              styles.mediaCaption,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {text}
            </Text>
          )}
        </TouchableOpacity>
      );

    case 'video':
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(mediaUrl, mediaType)}
          style={[styles.mediaContainer, styles.videoContainer]}
        >
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={[
                styles.mediaImage,
                {
                  width: mediaWidth && mediaWidth < maxWidth ? mediaWidth : maxWidth,
                  height: mediaHeight ? Math.min(mediaHeight, maxHeight) : 200,
                }
              ]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.videoPlaceholder, {
              width: maxWidth,
              height: 200
            }]}>
              <Text style={styles.videoPlaceholderText}>🎥 Video</Text>
              {mediaDuration && (
                <Text style={styles.videoDuration}>
                  {formatDuration(mediaDuration)}
                </Text>
              )}
            </View>
          )}
          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>▶️</Text>
          </View>
          {text && text.trim() && (
            <Text style={[
              styles.mediaCaption,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {text}
            </Text>
          )}
        </TouchableOpacity>
      );

    case 'audio':
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(mediaUrl, mediaType)}
          style={styles.audioContainer}
        >
          <View style={styles.audioPlayer}>
            <Text style={styles.audioIcon}>🎵</Text>
            <View style={styles.audioInfo}>
              <Text style={[
                styles.audioTitle,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {fileName || 'Audio Message'}
              </Text>
              {mediaDuration && (
                <Text style={[
                  styles.audioDuration,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {formatDuration(mediaDuration)}
                </Text>
              )}
            </View>
            <Text style={styles.playIcon}>▶️</Text>
          </View>
        </TouchableOpacity>
      );

    case 'document':
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(mediaUrl, mediaType)}
          style={styles.documentContainer}
        >
          <View style={styles.documentInfo}>
            <Text style={styles.documentIcon}>📄</Text>
            <View style={styles.documentDetails}>
              <Text style={[
                styles.documentName,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {fileName || 'Document'}
              </Text>
              {mediaSize && (
                <Text style={[
                  styles.documentSize,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {formatFileSize(mediaSize)}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );

    default:
      return null;
  }
};

export default MultimediaMessage;

const getStyles = (theme: any) => StyleSheet.create({
  // Multimedia styles
  mediaContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    borderRadius: 12,
  },
  mediaCaption: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  ownMessageText: {
    color: theme.surface || '#FFFFFF',
  },
  otherMessageText: {
    color: theme.text || '#000000',
  },
  videoContainer: {
    position: 'relative',
  },
  videoPlaceholder: {
    backgroundColor: theme.surfaceVariant || '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoPlaceholderText: {
    fontSize: 16,
    color: theme.textSecondary || '#6B7280',
  },
  videoDuration: {
    fontSize: 12,
    color: theme.textSecondary || '#6B7280',
    marginTop: 4,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 16,
    color: 'white',
  },
  audioContainer: {
    backgroundColor: theme.surfaceVariant || '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  audioDuration: {
    fontSize: 12,
    opacity: 0.7,
  },
  playIcon: {
    fontSize: 20,
  },
  documentContainer: {
    backgroundColor: theme.surfaceVariant || '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    opacity: 0.7,
  },
});