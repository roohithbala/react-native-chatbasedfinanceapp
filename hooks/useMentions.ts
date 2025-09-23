import { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../lib/services/api';
import { ChatUser } from '@/app/types/chat';

export const useMentions = (activeGroup: any) => {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<ChatUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const mentionTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMentionSearch = async (query: string) => {
    if (mentionTimeout.current) {
      clearTimeout(mentionTimeout.current);
    }

    setMentionQuery(query);

    if (query.length < 1) {
      setShowMentions(false);
      return;
    }

    mentionTimeout.current = setTimeout(async () => {
      try {
        // First try to search from group members
        if (activeGroup?.members) {
          const groupMembers = activeGroup.members
            .filter((member: any) => member?.userId)
            .map((member: any) => ({
              _id: member.userId._id,
              name: member.userId.name || 'Unknown',
              username: member.userId.username || 'unknown'
            }))
            .filter((user: ChatUser) =>
              user.name.toLowerCase().includes(query.toLowerCase()) ||
              user.username.toLowerCase().includes(query.toLowerCase())
            );

          if (groupMembers.length > 0) {
            setMentionResults(groupMembers.slice(0, 5));
            setShowMentions(true);
            return;
          }
        }

        // Fallback to API search
        const results = await usersAPI.searchByUsername(query);
        const formattedResults = results
          .filter((user: any) => user.username && user.name)
          .map((user: any) => ({
            _id: user._id,
            name: user.name,
            username: user.username
          }))
          .slice(0, 5);

        setMentionResults(formattedResults);
        setShowMentions(formattedResults.length > 0);
      } catch (error) {
        console.error('Error searching mentions:', error);
        setShowMentions(false);
      }
    }, 300);
  };

  const insertMention = (user: ChatUser) => {
    setShowMentions(false);
    setMentionQuery('');
    return user;
  };

  const hideMentions = () => {
    setShowMentions(false);
    setMentionQuery('');
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mentionTimeout.current) {
        clearTimeout(mentionTimeout.current);
      }
    };
  }, []);

  return {
    mentionQuery,
    mentionResults,
    showMentions,
    handleMentionSearch,
    insertMention,
    hideMentions
  };
};