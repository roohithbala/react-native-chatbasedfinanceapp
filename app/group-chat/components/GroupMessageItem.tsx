import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/lib/services/api';
import SplitBillChatCard from '../../components/SplitBillChatCard';

interface Message {
  _id: string;
  text: string;
  user?: { _id: string; name?: string; username?: string };
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaDuration?: number;
  mediaSize?: number;
  fileName?: string;
  createdAt: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system' | 'command' | 'split_bill' | 'split_bill_request';
  splitBillData?: any;
}

interface Props {
  item: Message;
  isOwnMessage: boolean;
  theme: any;
  onRetryImage: (id: string) => void;
  onOpenMedia: (mediaUrl: string, mediaType: string, fileName?: string) => void;
  currentUserId?: string;
  onSplitBillUpdate?: () => void;
  senderName?: string;
}

const GroupMessageItem: React.FC<Props> = ({ 
  item, 
  isOwnMessage, 
  theme, 
  onRetryImage, 
  onOpenMedia, 
  currentUserId, 
  onSplitBillUpdate,
  senderName 
}) => {
  const [imageError, setImageError] = useState(false);

  // Show split bill card if current user is creator or participant
  const isSplitBill = (item.type === 'split_bill_request' || item.type === 'split_bill') && item.splitBillData && currentUserId;
  
  // Debug logging
  if (isSplitBill) {
    console.log('🎫 Group split bill message detected:', {
      messageId: item._id,
      type: item.type,
      text: item.text,
      currentUserId,
      splitBillId: item.splitBillData._id,
      createdById: item.splitBillData.createdBy?._id,
      createdByMatches: item.splitBillData.createdBy?._id === currentUserId,
      participants: item.splitBillData.participants,
      participantIds: item.splitBillData.participants?.map((p: any) => typeof p.userId === 'object' ? p.userId._id : p.userId),
    });
  }
  
  const isInvolved = isSplitBill && (
    item.splitBillData.createdBy?._id === currentUserId ||
    item.splitBillData.participants?.some((p: any) => {
      const participantId = typeof p.userId === 'object' ? p.userId._id : p.userId;
      return participantId === currentUserId;
    })
  );
  
  console.log('🔍 GroupMessageItem rendering:', {
    messageId: item._id,
    text: item.text,
    type: item.type,
    userId: item.user?._id,
    currentUserId,
    isOwnMessage,
    isSplitBill,
    isInvolved,
    willShowCard: isInvolved,
    willShowRegularMessage: !isInvolved
  });

  return (
    <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      {!isOwnMessage && (
        <View style={[styles.otherAvatarContainer, { backgroundColor: theme.surfaceSecondary }]}>
          <Text style={[styles.otherAvatarText, { color: theme.text }]}>
            {(item.user?.name || item.user?.username || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Split Bill Card for both creator and participant */}
      {isInvolved ? (
        <View style={{ flex: 1 }}>
          {!isOwnMessage && senderName && (
            <Text style={[styles.senderName, { color: theme.textSecondary }]}>{senderName}</Text>
          )}
          <SplitBillChatCard
            splitBill={item.splitBillData}
            currentUserId={currentUserId}
            onPaymentSuccess={onSplitBillUpdate}
            onRejectSuccess={onSplitBillUpdate}
          />
        </View>
      ) : (
        /* Regular message bubble */
        <View style={{ flex: 1 }}>
          {!isOwnMessage && senderName && (
            <Text style={[styles.senderName, { color: theme.textSecondary }]}>{senderName}</Text>
          )}
          <View style={[styles.bubble, isOwnMessage ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface }]}> 
            {/* Media */}
            {item.mediaType === 'image' && item.mediaUrl && (
              <View style={styles.mediaContainer}>
                {imageError ? (
                  <View style={[styles.mediaImage, { backgroundColor: theme.surfaceSecondary }]}>
                    <Ionicons name="image" size={48} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary }}>Image failed to load</Text>
                    <TouchableOpacity onPress={() => { setImageError(false); onRetryImage(item._id); }}>
                      <Text style={{ color: theme.primary }}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Image
                    source={{ uri: `${API_BASE_URL}${item.mediaUrl}` }}
                    style={styles.mediaImage}
                    onError={() => { setImageError(true); onRetryImage(item._id); }}
                  />
                )}
                {item.text && <Text style={[styles.mediaCaption, isOwnMessage ? { color: theme.surface } : { color: theme.text }]}>{item.text}</Text>}
              </View>
            )}

            {item.mediaType === 'video' && item.mediaUrl && (
              <TouchableOpacity style={styles.mediaContainer} onPress={() => onOpenMedia(item.mediaUrl!, 'video', item.fileName)}>
                <View style={[styles.videoPlaceholder, { backgroundColor: theme.surfaceSecondary }]}>
                  <Ionicons name="videocam" size={48} color={isOwnMessage ? theme.surface : theme.textSecondary} />
                  <Text style={{ marginLeft: 8, color: isOwnMessage ? theme.surface : theme.textSecondary }}>Video</Text>
                  {item.mediaDuration && <Text style={{ marginLeft: 8, color: theme.textSecondary }}>{Math.floor(item.mediaDuration/60)}:{(item.mediaDuration%60).toString().padStart(2,'0')}</Text>}
                </View>
                <View style={styles.playButton}><Text style={styles.playButtonText}>▶️</Text></View>
                {item.text && <Text style={[styles.mediaCaption, isOwnMessage ? { color: theme.surface } : { color: theme.text }]}>{item.text}</Text>}
              </TouchableOpacity>
            )}

            {item.mediaType === 'audio' && item.mediaUrl && (
              <TouchableOpacity style={[styles.audioPlaceholder, { backgroundColor: theme.surfaceSecondary }]}> 
                <Ionicons name="musical-notes" size={32} color={isOwnMessage ? theme.surface : theme.textSecondary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: isOwnMessage ? theme.surface : theme.text }}>{item.fileName || 'Audio'}</Text>
                  {item.mediaDuration && <Text style={{ color: theme.textSecondary }}>{Math.floor(item.mediaDuration/60)}:{(item.mediaDuration%60).toString().padStart(2,'0')}</Text>}
                </View>
              </TouchableOpacity>
            )}

            {item.mediaType === 'document' && item.mediaUrl && (
              <TouchableOpacity style={[styles.documentPlaceholder, { backgroundColor: theme.surfaceSecondary }]}
                onPress={() => onOpenMedia(item.mediaUrl!, 'document', item.fileName)}>
                <Ionicons name="document" size={32} color={isOwnMessage ? theme.surface : theme.textSecondary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: isOwnMessage ? theme.surface : theme.text }}>{item.fileName || 'Document'}</Text>
                  {item.mediaSize && <Text style={{ color: theme.textSecondary }}>{(item.mediaSize/1024/1024).toFixed(2)} MB</Text>}
                </View>
              </TouchableOpacity>
            )}

            {/* Plain text */}
            {(!item.mediaType || (item.text && !item.text.includes('📷') && !item.text.includes('🎥') && !item.text.includes('🎵') && !item.text.includes('📄'))) && (
              <Text style={{ color: isOwnMessage ? theme.surface : theme.text }}>{item.text}</Text>
            )}

            <Text style={{ fontSize: 11, color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.textSecondary, marginTop: 6 }}>
              {format(new Date(item.createdAt), 'HH:mm')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: { 
    marginVertical: 6, 
    maxWidth: '85%', 
    flexDirection: 'row', 
    alignItems: 'flex-end' 
  },
  otherAvatarContainer: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 8, 
    marginBottom: 4 
  },
  otherAvatarText: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: { 
    padding: 14, 
    borderRadius: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  ownMessage: { 
    alignSelf: 'flex-end', 
    marginLeft: 60 
  },
  otherMessage: { 
    alignSelf: 'flex-start', 
    marginRight: 60 
  },
  mediaContainer: { 
    marginBottom: 8, 
    borderRadius: 12, 
    overflow: 'hidden' 
  },
  mediaImage: { 
    width: 200, 
    height: 200, 
    borderRadius: 12 
  },
  videoPlaceholder: { 
    width: 200, 
    height: 120, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    flexDirection: 'row' 
  },
  audioPlaceholder: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 12, 
    minWidth: 200 
  },
  documentPlaceholder: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 12, 
    minWidth: 200 
  },
  mediaCaption: { 
    marginTop: 6, 
    fontSize: 14 
  },
  playButton: { 
    position: 'absolute', 
    top: '50%', 
    left: '50%', 
    transform: [{ translateX: -20 }, { translateY: -20 }], 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  playButtonText: { 
    fontSize: 16, 
    color: 'white' 
  },
});

export default GroupMessageItem;
