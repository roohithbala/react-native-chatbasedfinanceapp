import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MediaControlsProps {
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
  canDownload: boolean;
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  onClose,
  onShare,
  onDownload,
  canDownload,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={28} color="white" />
      </TouchableOpacity>

      <View style={styles.headerActions}>
        <TouchableOpacity onPress={onShare} style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>

        {canDownload && (
          <TouchableOpacity onPress={onDownload} style={styles.actionButton}>
            <Ionicons name="download-outline" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default MediaControls;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
});