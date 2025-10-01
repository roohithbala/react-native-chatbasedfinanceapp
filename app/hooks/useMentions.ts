import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../../lib/services/api';

interface User {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export const useMentions = (groupMembers: User[] = []) => {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const updateMentionQuery = useCallback((text: string, cursorPosition: number) => {
    const mentionMatch = text.substring(0, cursorPosition).match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setMentionStartIndex(cursorPosition - query.length - 1);
      setShowMentions(true);

      // Filter group members based on query
      const filtered = groupMembers.filter(member =>
        member.name.toLowerCase().includes(query.toLowerCase()) ||
        (member.username && member.username.toLowerCase().includes(query.toLowerCase()))
      );
      setMentionSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setShowMentions(false);
      setMentionQuery('');
      setMentionStartIndex(-1);
      setMentionSuggestions([]);
    }
  }, [groupMembers]);

  const selectMention = useCallback((user: User, currentText: string) => {
    if (mentionStartIndex >= 0) {
      const beforeMention = currentText.substring(0, mentionStartIndex);
      const afterMention = currentText.substring(mentionStartIndex + mentionQuery.length + 1);
      const newText = `${beforeMention}@${user.name} ${afterMention}`;
      setShowMentions(false);
      setMentionQuery('');
      setMentionStartIndex(-1);
      setMentionSuggestions([]);
      return newText;
    }
    return currentText;
  }, [mentionStartIndex, mentionQuery]);

  const hideMentions = useCallback(() => {
    setShowMentions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
    setMentionSuggestions([]);
  }, []);

  // Search for users when query is not empty and no group members match
  useEffect(() => {
    if (mentionQuery && mentionSuggestions.length === 0) {
      const searchUsers = async () => {
        try {
          const users = await usersAPI.searchUsers(mentionQuery);
          setMentionSuggestions(users.slice(0, 5));
        } catch (error) {
          console.error('Error searching users for mentions:', error);
        }
      };

      const timeoutId = setTimeout(searchUsers, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [mentionQuery, mentionSuggestions.length]);

  return {
    mentionQuery,
    mentionSuggestions,
    showMentions,
    mentionStartIndex,
    updateMentionQuery,
    selectMention,
    hideMentions,
  };
};

export default useMentions;