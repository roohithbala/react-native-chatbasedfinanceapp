import { useState, useEffect, useCallback, useRef } from 'react';
import chatAPI from '../../lib/services/chatAPI';
import { socketService } from '../../lib/services/socketService';
import { Message } from '../types/chat';

interface GroupChat {
  _id: string;
  name: string;
  members: any[];
}

export const useGroupChat = (groupId: string, currentUser: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [group, setGroup] = useState<GroupChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<any>(null);

  const loadMessages = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      const response = await chatAPI.getMessages(groupId);
      setMessages(response.data.messages);
      if (response.data.group) {
        setGroup(response.data.group);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const sendMessage = useCallback(async (text: string, type: Message['type'] = 'text') => {
    if (!text.trim() || !groupId || !currentUser) return;

    try {
      const messageData = {
        text: text.trim(),
        type,
        status: 'sent' as const,
      };

      // Optimistically add message to UI
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        user: {
          _id: currentUser._id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        groupId,
        type,
        status: 'sent',
        readBy: [],
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Send via socket for real-time delivery
      socketService.sendMessage(groupId, { text: text.trim(), user: currentUser, type }, null);

      // Also send via API as backup
      await chatAPI.sendMessage(groupId, messageData);

    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp-')));
    }
  }, [groupId, currentUser]);

  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!groupId || messageIds.length === 0) return;

    try {
      await chatAPI.markAsRead(groupId, messageIds);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [groupId]);

  const startTyping = useCallback(() => {
    if (groupId) {
      socketService.startTyping(groupId);
    }
  }, [groupId]);

  const stopTyping = useCallback(() => {
    if (groupId) {
      socketService.stopTyping(groupId);
    }
  }, [groupId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    if (groupId && currentUser) {
      loadMessages();
      socketService.connect();
      socketService.joinGroup(groupId);
      socketService.joinUserRoom(currentUser._id);
    }
  }, [groupId, currentUser, loadMessages]);

  useEffect(() => {
    if (!groupId) return;

    const handleNewMessage = (message: Message) => {
      if (message.groupId === groupId) {
        setMessages(prev => {
          // Remove any optimistic messages with the same content
          const filtered = prev.filter(msg => !msg._id.startsWith('temp-') || msg.text !== message.text);
          return [...filtered, message];
        });
      }
    };

    const handleTypingStart = (data: { groupId: string; user: any }) => {
      if (data.groupId === groupId && data.user._id !== currentUser?._id) {
        setTypingUsers(prev => new Set(prev).add(data.user.name));
      }
    };

    const handleTypingStop = (data: { groupId: string; user: any }) => {
      if (data.groupId === groupId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user.name);
          return newSet;
        });
      }
    };

    socketService.onReceiveMessage(handleNewMessage);
    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);

    return () => {
      socketService.removeAllListeners();
    };
  }, [groupId, currentUser]);

  return {
    messages,
    group,
    loading,
    error,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    scrollToBottom,
    messagesEndRef,
    loadMessages,
  };
};

export default useGroupChat;