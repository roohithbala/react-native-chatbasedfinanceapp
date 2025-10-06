import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MediaContentProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
}

export const MediaContent: React.FC<MediaContentProps> = ({
  mediaUrl,
  mediaType,
  fileName,
}) => {
  const player = useVideoPlayer(mediaUrl);

  const renderContent = () => {
    switch (mediaType) {
      case 'image':
        return (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.mediaContent}
            contentFit="contain"
          />
        );

      case 'video':
        return (
          <VideoView
            player={player}
            style={styles.mediaContent}
            contentFit="contain"
            allowsFullscreen
            allowsPictureInPicture
          />
        );

      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <Ionicons name="musical-notes" size={64} color="#666" />
            <Text style={styles.audioText}>{fileName || 'Audio File'}</Text>
            <VideoView
              player={player}
              style={styles.audioPlayer}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
          </View>
        );

      case 'document':
        return (
          <View style={styles.documentContainer}>
            <Ionicons name="document" size={64} color="#666" />
            <Text style={styles.documentText}>{fileName || 'Document'}</Text>
            <Text style={styles.documentSubtext}>Tap download to save this file</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.content}>
      {renderContent()}
    </View>
  );
};

export default MediaContent;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContent: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  audioContainer: {
    alignItems: 'center',
    padding: 40,
  },
  audioText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  audioPlayer: {
    width: screenWidth * 0.8,
    height: 50,
  },
  documentContainer: {
    alignItems: 'center',
    padding: 40,
  },
  documentText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  documentSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});