import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Keyboard,
} from 'react-native';
import { usersAPI } from '@/lib/services/api';
import { ChatUser } from '@/app/types/chat';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface MentionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  onUserMention?: (user: ChatUser) => void;
  groupId?: string; // For group context to load group members
  activeGroup?: any; // Group object with members
  isDirectChat?: boolean; // Whether this is a direct chat
  otherUser?: any; // For direct chats, the other user
}

interface UserSuggestion {
  id: string;
  name: string;
  username: string;
  displayText: string;
  type: 'user';
}

type Suggestion = UserSuggestion;

export default function MentionInput({
  value,
  onChangeText,
  placeholder = 'Type @ to mention someone...',
  style,
  onUserMention,
  groupId,
  activeGroup,
  isDirectChat = false,
  otherUser,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const inputRef = useRef<TextInput>(null);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    const handleSuggestions = async () => {
      const mentionMatch = getCurrentMention();
      if (mentionMatch) {
        const query = mentionMatch.query;
        if (query.length > 0) {
          try {
            let userSuggestions: any[] = [];

            // For direct chats, only show the other user
            if (isDirectChat && otherUser) {
              const userId = otherUser._id || otherUser.id;
              if (!userId || userId === 'undefined' || userId === 'null') {
                console.error('Invalid user ID for direct chat otherUser:', otherUser);
                userSuggestions = [];
              } else {
                const matchesQuery = otherUser.name.toLowerCase().includes(query.toLowerCase()) ||
                                    otherUser.username.toLowerCase().includes(query.toLowerCase());

                if (matchesQuery) {
                  userSuggestions = [{
                    _id: userId,
                    name: otherUser.name,
                    username: otherUser.username
                  }];
                }
              }
            }
            // For group chats, first try to search from group members
            else if (activeGroup?.members) {
              userSuggestions = activeGroup.members
                .filter((member: any) => member?.userId && (member.userId._id || member.userId.id))
                .map((member: any) => {
                  const userId = member.userId._id || member.userId.id;
                  if (!userId || userId === 'undefined' || userId === 'null') {
                    console.error('Invalid user ID for group member:', member);
                    return null;
                  }
                  return {
                    _id: userId,
                    name: member.userId.name || 'Unknown',
                    username: member.userId.username || 'unknown'
                  };
                })
                .filter((user: any) => user !== null)
                .filter((user: any) =>
                  user.name.toLowerCase().includes(query.toLowerCase()) ||
                  user.username.toLowerCase().includes(query.toLowerCase())
                );
            }
            // Fallback to API search
            else {
              const results = await usersAPI.searchByUsername(query);
              userSuggestions = results
                .filter((user: any) => user.username && user.name && (user._id || user.id))
                .map((user: any) => {
                  const userId = user._id || user.id;
                  if (!userId || userId === 'undefined' || userId === 'null') {
                    console.error('Invalid user ID from API search:', user);
                    return null;
                  }
                  return {
                    _id: userId,
                    name: user.name,
                    username: user.username
                  };
                })
                .filter((user: any) => user !== null);
            }

            const formattedUserSuggestions: UserSuggestion[] = userSuggestions.slice(0, 5).map(user => ({
              id: user._id,
              name: user.name,
              username: user.username,
              displayText: user.name,
              type: 'user',
            }));

            setSuggestions(formattedUserSuggestions);
            setShowSuggestions(true);
          } catch (error) {
            console.error('Error fetching user suggestions:', error);
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    handleSuggestions();
  }, [value, cursorPosition, groupId]);

  const getCurrentMention = () => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      // Check if there's a space before the @ (to ensure it's a new mention)
      const charBeforeAt = atIndex > 0 ? textBeforeCursor.charAt(atIndex - 1) : ' ';

      if (charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) {
        // Check if there are spaces in the mention text (invalidates the mention)
        if (textAfterAt.includes(' ')) {
          return null;
        }

        setMentionStart(atIndex);
        return {
          query: textAfterAt,
          start: atIndex,
          end: cursorPosition,
        };
      }
    }

    return null;
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
  };

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const handleSuggestionPress = (suggestion: Suggestion) => {
    const mentionText = `@${suggestion.username}`;

    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(cursorPosition);

    const newText = beforeMention + mentionText + ' ' + afterMention;
    onChangeText(newText);

    // Move cursor to after the mention
    setTimeout(() => {
      inputRef.current?.setNativeProps({
        selection: { start: mentionStart + mentionText.length + 1, end: mentionStart + mentionText.length + 1 }
      });
    }, 100);

    setShowSuggestions(false);
    setSuggestions([]);

    // Notify parent component about the mention
    if (onUserMention) {
      // Validate the suggestion ID before fetching
      if (!suggestion.id || suggestion.id === 'undefined' || suggestion.id === 'null') {
        console.error('Invalid user ID in suggestion:', suggestion);
        return;
      }

      // Fetch the full user details
      usersAPI.getUser(suggestion.id)
        .then(response => {
          onUserMention(response);
        })
        .catch(error => {
          console.error('Error fetching user details:', error);
        });
    }
  };

  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={styles.suggestionContent}>
        <Text style={[styles.suggestionName, { color: theme.text }]}>{item.displayText}</Text>
        <Text style={[styles.suggestionUsername, { color: theme.textSecondary }]}>@{item.username}</Text>
      </View>
      <View style={styles.suggestionIcon}>
        <Text style={styles.mentionEmoji}>👤</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TextInput
        ref={inputRef}
        style={[styles.input, style, { color: theme.text, backgroundColor: 'transparent' }]}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline
        scrollEnabled={false} // Disable scrolling to prevent text cutoff
        autoCapitalize="sentences"
        autoCorrect={true}
        keyboardType="default"
        returnKeyType="default"
        blurOnSubmit={false}
        editable={true}
        selectTextOnFocus={false}
      />

      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  input: {
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 8, // Add vertical padding for better text visibility
    fontSize: 16,
    minHeight: 20,
    maxHeight: 120, // Increased to match MessageInput container
    backgroundColor: 'transparent',
    textAlignVertical: 'top', // Align text to top for multiline
    opacity: 1, // Ensure text is always visible
    includeFontPadding: false, // Prevent font padding issues
  },
  suggestionsContainer: {
    position: 'absolute',
    top: -210, // Position above the input (negative value to go up)
    left: 0,
    right: 0,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  suggestionUsername: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  suggestionIcon: {
    marginLeft: 12,
  },
  mentionEmoji: {
    fontSize: 20,
  },
});