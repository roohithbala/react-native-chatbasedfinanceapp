import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
} from 'react-native';
import { MediaControls } from './MediaControls';
import { MediaContent } from './MediaContent';
import { ProgressIndicator } from './ProgressIndicator';

interface MediaViewerProps {
  visible: boolean;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | 'audio' | 'document' | null;
  fileName?: string;
  onClose: () => void;
  onDownload?: (url: string, type: string, fileName?: string) => void;
  isLoading?: boolean;
  loadingProgress?: number;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  visible,
  mediaUrl,
  mediaType,
  fileName,
  onClose,
  onDownload,
  isLoading = false,
  loadingProgress,
}) => {
  const handleDownload = () => {
    if (mediaUrl && mediaType) {
      onDownload?.(mediaUrl, mediaType, fileName);
    }
  };

  const handleShare = () => {
    // Share functionality will be handled by MediaControls component
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <MediaControls
          onClose={onClose}
          onShare={handleShare}
          onDownload={handleDownload}
          canDownload={!!(mediaType && mediaUrl)}
        />

        <View style={styles.content}>
          {mediaUrl && mediaType && (
            <MediaContent
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              fileName={fileName}
            />
          )}
        </View>

        <ProgressIndicator
          isLoading={isLoading}
          progress={loadingProgress}
          color="white"
        />
      </View>
    </Modal>
  );
};

export default MediaViewer;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});