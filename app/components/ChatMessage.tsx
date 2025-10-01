import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SplitBillMessage from './SplitBillMessage';
import { useTheme } from '../context/ThemeContext';
import { MediaViewer } from './MediaViewer';
import { MessageContent } from './MessageContent';
import { MultimediaMessage } from './MultimediaMessage';
import { MessageFooter } from './MessageFooter';
import { MessageBubble } from './MessageBubble';

interface LocationMention {
  locationId: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface ChatMessageProps {
  text: string;
  createdAt: string;
  isOwnMessage: boolean;
  status: 'sent' | 'delivered' | 'read';
  senderName?: string;
  locationMentions?: LocationMention[];
  onLocationMentionPress?: (location: LocationMention) => void;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system' | 'command' | 'split_bill';
  splitBillData?: any;
  currentUserId?: string;
  onPayBill?: (splitBillId: string) => void;
  onViewSplitBillDetails?: (splitBillId: string) => void;
  // Multimedia fields
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaSize?: number;
  mediaDuration?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  onMediaPress?: (mediaUrl: string, mediaType: string) => void;
}

export default function ChatMessage({
  text,
  createdAt,
  isOwnMessage,
  status,
  senderName,
  locationMentions = [],
  onLocationMentionPress,
  type = 'text',
  splitBillData,
  currentUserId,
  onPayBill,
  onViewSplitBillDetails,
  // Multimedia props
  mediaUrl,
  mediaType,
  mediaSize,
  mediaDuration,
  mediaWidth,
  mediaHeight,
  thumbnailUrl,
  fileName,
  mimeType,
  onMediaPress
}: ChatMessageProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);

  const handleMediaPress = () => {
    setMediaViewerVisible(true);
  };

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      {!isOwnMessage && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}

      <MessageBubble isOwnMessage={isOwnMessage} theme={theme}>
        {type === 'split_bill' && splitBillData && currentUserId ? (
          <SplitBillMessage
            splitBillData={splitBillData}
            currentUserId={currentUserId}
            onPayBill={onPayBill}
            onViewDetails={onViewSplitBillDetails}
          />
        ) : (
          <View>
            <MultimediaMessage
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              mediaSize={mediaSize}
              mediaDuration={mediaDuration}
              mediaWidth={mediaWidth}
              mediaHeight={mediaHeight}
              thumbnailUrl={thumbnailUrl}
              fileName={fileName}
              text={text}
              isOwnMessage={isOwnMessage}
              onMediaPress={handleMediaPress}
              theme={theme}
            />
            {(!mediaUrl || !mediaType) && text && text.trim() && (
              <MessageContent
                text={text}
                locationMentions={locationMentions}
                onLocationMentionPress={onLocationMentionPress}
                isOwnMessage={isOwnMessage}
                theme={theme}
              />
            )}
          </View>
        )}

        <MessageFooter
          createdAt={createdAt}
          status={status}
          isOwnMessage={isOwnMessage}
          theme={theme}
        />
      </MessageBubble>

      <MediaViewer
        visible={mediaViewerVisible}
        mediaUrl={mediaUrl || null}
        mediaType={mediaType || null}
        fileName={fileName}
        onClose={() => setMediaViewerVisible(false)}
        onDownload={(url, type, fileName) => {
          console.log('Downloaded:', fileName);
        }}
      />
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: theme.textSecondary || '#6B7280',
    marginBottom: 2,
    marginLeft: 12,
  },
});
