import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import SplitBillMessage from './SplitBillMessage';

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
  type?: 'text' | 'image' | 'file' | 'system' | 'command' | 'split_bill';
  splitBillData?: any;
  currentUserId?: string;
  onPayBill?: (splitBillId: string) => void;
  onViewSplitBillDetails?: (splitBillId: string) => void;
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
  onViewSplitBillDetails
}: ChatMessageProps) {
  const renderMessageText = () => {
    if (locationMentions.length === 0) {
      return (
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {text}
        </Text>
      );
    }

    // Create a map of location mentions for quick lookup
    const mentionMap = new Map();
    locationMentions.forEach(mention => {
      mentionMap.set(`@${mention.locationName}`, mention);
    });

    // Split text by location mentions and render accordingly
    const parts = [];
    let remainingText = text;
    let key = 0;

    // Find all @mentions in the text
    const mentionRegex = /(@\w+)/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionText = match[0];
      const mention = mentionMap.get(mentionText);

      if (mention) {
        // Add text before the mention
        const beforeText = text.substring(0, match.index);
        if (beforeText) {
          parts.push(
            <Text key={key++} style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {beforeText}
            </Text>
          );
        }

        // Add the location mention
        parts.push(
          <TouchableOpacity
            key={key++}
            onPress={() => onLocationMentionPress?.(mention)}
            style={styles.locationMention}
          >
            <Text style={[
              styles.locationMentionText,
              isOwnMessage ? styles.ownLocationMentionText : styles.otherLocationMentionText
            ]}>
              📍 {mention.locationName}
            </Text>
          </TouchableOpacity>
        );

        // Update remaining text
        remainingText = text.substring(match.index + match[0].length);
      }
    }

    // Add remaining text
    if (remainingText) {
      parts.push(
        <Text key={key++} style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {remainingText}
        </Text>
      );
    }

    return parts.length > 0 ? parts : (
      <Text style={[
        styles.messageText,
        isOwnMessage ? styles.ownMessageText : styles.otherMessageText
      ]}>
        {text}
      </Text>
    );
  };

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      {!isOwnMessage && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble
      ]}>
        {type === 'split_bill' && splitBillData && currentUserId ? (
          <SplitBillMessage
            splitBillData={splitBillData}
            currentUserId={currentUserId}
            onPayBill={onPayBill}
            onViewDetails={onViewSplitBillDetails}
          />
        ) : (
          renderMessageText()
        )}
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {format(new Date(createdAt), 'HH:mm')}
          </Text>
          {isOwnMessage && status && (
            <Text style={[
              styles.status,
              status === 'read' && styles.statusRead
            ]}>
              {status === 'sent' ? '✓' : status === 'delivered' ? '✓✓' : '✓✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#6B7280',
    marginBottom: 2,
    marginLeft: 12,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#EFF6FF',
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#000000',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#667781',
    marginRight: 4,
  },
  status: {
    fontSize: 11,
    color: '#667781',
  },
  statusRead: {
    color: '#2563EB',
  },
  locationMention: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginHorizontal: 2,
  },
  locationMentionText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  ownLocationMentionText: {
    color: '#2563EB',
  },
  otherLocationMentionText: {
    color: '#059669',
  },
});
