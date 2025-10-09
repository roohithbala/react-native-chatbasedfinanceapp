import React, { useEffect, useRef } from 'react';
import { FlatList } from 'react-native';
import MessageItem from './MessageItem';

interface Message {
  _id: string;
  text: string;
  sender?: { _id: string; name?: string; username?: string };
  receiver?: { _id: string; name?: string; username?: string };
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaDuration?: number;
  mediaSize?: number;
  fileName?: string;
  createdAt: string;
}

interface Props {
  messages: Message[];
  currentUserId?: string;
  theme: any;
  onRetryImage: (id: string) => void;
  onOpenMedia: (mediaUrl: string, mediaType: string, fileName?: string) => void;
  onSplitBillUpdate?: () => void;
  latestSplitBill?: any;
  onDeleteMessage?: (messageId: string) => void;
}

const ChatMessages: React.FC<Props> = ({ messages, currentUserId, theme, onRetryImage, onOpenMedia, onSplitBillUpdate, latestSplitBill, onDeleteMessage }) => {
  const flatListRef = useRef<FlatList>(null);

  // Sort messages chronologically (oldest first)
  const sortedMessages = React.useMemo(() => {
    const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    console.log('📨 ChatMessages rendered with:', {
      totalMessages: messages.length,
      currentUserId,
      currentUserIdType: typeof currentUserId,
      messagesPreview: sorted.slice(0, 5).map(m => ({
        id: m._id,
        text: m.text?.substring(0, 30),
        senderId: m.sender?._id,
        senderIdType: typeof m.sender?._id,
        senderName: m.sender?.name || m.sender?.username,
        receiverId: m.receiver?._id,
        receiverName: m.receiver?.name || m.receiver?.username,
        isOwn: m.sender?._id === currentUserId,
        comparison: `"${m.sender?._id}" === "${currentUserId}"`
      }))
    });
    
    return sorted;
  }, [messages, currentUserId]);

  // Auto-scroll to latest messages on mount and when new messages arrive
  useEffect(() => {
    if (sortedMessages.length > 0) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [sortedMessages.length]); // Only trigger when message count changes

  return (
    <FlatList
      ref={flatListRef}
      data={sortedMessages}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const isOwn = item.sender?._id === currentUserId;
        console.log(`📬 Rendering message: ${item.text?.substring(0, 20)}... | isOwn: ${isOwn} | sender: ${item.sender?._id} | current: ${currentUserId}`);
        
        return (
          <MessageItem
            item={item}
            isOwnMessage={isOwn}
            theme={theme}
            onRetryImage={onRetryImage}
            onOpenMedia={onOpenMedia}
            currentUserId={currentUserId}
            onSplitBillUpdate={onSplitBillUpdate}
            latestSplitBill={latestSplitBill}
            onDeleteMessage={onDeleteMessage}
          />
        );
      }}
      contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      onContentSizeChange={() => {
        // Scroll to end when content size changes (new messages)
        flatListRef.current?.scrollToEnd({ animated: true });
      }}
      // Messages display in chronological order (oldest at top, newest at bottom)
      // Like WhatsApp - scroll down to see latest
    />
  );
};

export default ChatMessages;
