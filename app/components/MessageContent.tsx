import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface LocationMention {
  locationId: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface MessageContentProps {
  text: string;
  locationMentions?: LocationMention[];
  onLocationMentionPress?: (location: LocationMention) => void;
  isOwnMessage: boolean;
  theme: any;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  text,
  locationMentions = [],
  onLocationMentionPress,
  isOwnMessage,
  theme,
}) => {
  const styles = getStyles(theme);

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

  return <>{parts.length > 0 ? parts : (
    <Text style={[
      styles.messageText,
      isOwnMessage ? styles.ownMessageText : styles.otherMessageText
    ]}>
      {text}
    </Text>
  )}</>;
};

export default MessageContent;

const getStyles = (theme: any) => StyleSheet.create({
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: theme.surface || '#FFFFFF',
  },
  otherMessageText: {
    color: theme.text || '#000000',
  },
  locationMention: {
    backgroundColor: theme.primary ? `${theme.primary}20` : 'rgba(37, 99, 235, 0.1)',
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
    color: theme.primary || '#2563EB',
  },
  otherLocationMentionText: {
    color: theme.success || '#059669',
  },
});