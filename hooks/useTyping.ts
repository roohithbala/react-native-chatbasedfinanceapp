import { useState, useEffect, useRef } from 'react';
import { socketService } from '../lib/services/socketService';
import { ChatUser } from '@/app/types/chat';

export const useTyping = (groupId: string | null, currentUserId: string | undefined) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<ChatUser[]>([]);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const startTyping = () => {
    if (!isTyping && groupId) {
      setIsTyping(true);
      socketService.startTyping(groupId);
    }
  };

  const stopTyping = () => {
    if (isTyping && groupId) {
      setIsTyping(false);
      socketService.stopTyping(groupId);
    }
  };

  const handleMessageChange = (text: string, callback?: (text: string) => void) => {
    callback?.(text);

    // Handle typing indicators
    if (text.trim() && !isTyping && groupId) {
      startTyping();
    } else if (!text.trim() && isTyping && groupId) {
      stopTyping();
    }

    // Clear existing typing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Set new typing timeout
    if (text.trim()) {
      typingTimeout.current = setTimeout(() => {
        stopTyping();
      }, 2000); // Stop typing after 2 seconds of inactivity
    }
  };

  // Set up socket listeners
  useEffect(() => {
    if (!groupId) return;

    const handleTypingStart = (data: { groupId: string; user: any }) => {
      if (data.groupId === groupId && data.user._id !== currentUserId) {
        setTypingUsers(prev => {
          const user = data.user;
          if (!prev.find(u => u._id === user._id)) {
            return [...prev, user];
          }
          return prev;
        });
      }
    };

    const handleTypingStop = (data: { groupId: string; user: any }) => {
      if (data.groupId === groupId) {
        setTypingUsers(prev => prev.filter(u => u._id !== data.user._id));
      }
    };

    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);

    // Cleanup function
    return () => {
      // Note: We don't remove listeners here as socketService handles cleanup
      // This prevents issues with multiple components using the same listeners
    };
  }, [groupId, currentUserId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  return {
    isTyping,
    typingUsers,
    handleMessageChange,
    startTyping,
    stopTyping
  };
};