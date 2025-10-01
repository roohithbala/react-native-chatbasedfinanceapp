import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../../lib/services/socketService';

interface TypingUser {
  _id: string;
  name: string;
}

export const useTyping = (groupId: string, currentUser: any) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!groupId || !currentUser) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start event
    socketService.startTyping(groupId);

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [groupId, currentUser]);

  const stopTyping = useCallback(() => {
    if (!groupId) return;

    socketService.stopTyping(groupId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [groupId]);

  const handleTypingStart = useCallback((data: { groupId: string; user: TypingUser }) => {
    if (data.groupId === groupId && data.user._id !== currentUser?._id) {
      setTypingUsers(prev => {
        const exists = prev.some(user => user._id === data.user._id);
        if (!exists) {
          return [...prev, data.user];
        }
        return prev;
      });
    }
  }, [groupId, currentUser]);

  const handleTypingStop = useCallback((data: { groupId: string; user: TypingUser }) => {
    if (data.groupId === groupId) {
      setTypingUsers(prev => prev.filter(user => user._id !== data.user._id));
    }
  }, [groupId]);

  // Set up socket listeners
  useEffect(() => {
    if (!groupId) return;

    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);

    return () => {
      socketService.removeAllListeners();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [groupId, handleTypingStart, handleTypingStop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isTyping: typingUsers.length > 0,
  };
};

export default useTyping;