import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { directMessagesAPI } from '../../lib/services/api';
import { socketService } from '../../lib/services/socketService';

interface Chat {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    avatar?: string;
  }>;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  createdAt: string;
}

interface Message {
  _id: string;
  content: string;
  senderId: string;
  chatId: string;
  createdAt: string;
  readBy: string[];
}

export const useChatsLogic = (currentUser: any) => {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await directMessagesAPI.getRecentChats();
      setChats(response);
      setError(null);
    } catch (err) {
      setError('Failed to load chats');
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createChat = useCallback(async (participantId: string) => {
    try {
      // For now, just navigate to the chat - the backend will handle creating if needed
      router.push(`/chat/${participantId}`);
    } catch (err) {
      setError('Failed to create chat');
      console.error('Error creating chat:', err);
    }
  }, [router]);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      // Note: This might not be implemented in the backend yet
      // For now, we'll just remove from local state
      setChats(prev => prev.filter(chat => chat._id !== chatId));
    } catch (err) {
      setError('Failed to delete chat');
      console.error('Error deleting chat:', err);
    }
  }, []);

  const markChatAsRead = useCallback(async (chatId: string) => {
    try {
      await directMessagesAPI.markAsRead(chatId);
      setChats(prev => prev.map(chat =>
        chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadChats();
    }
  }, [currentUser, loadChats]);

  useEffect(() => {
    if (currentUser) {
      socketService.connect();
      socketService.joinUserRoom(currentUser._id);

      const handleNewMessage = (message: Message) => {
        setChats(prev => prev.map(chat => {
          if (chat._id === message.chatId) {
            return {
              ...chat,
              lastMessage: {
                content: message.content,
                senderId: message.senderId,
                createdAt: message.createdAt,
              },
              unreadCount: message.senderId !== currentUser._id ? chat.unreadCount + 1 : chat.unreadCount,
            };
          }
          return chat;
        }));
      };

      socketService.onReceiveMessage((message) => {
        if (message.groupId) return; // Skip group messages
        handleNewMessage({
          _id: message._id,
          content: message.text,
          senderId: message.user._id,
          chatId: message.user._id === currentUser._id ? message.user._id : currentUser._id,
          createdAt: message.createdAt,
          readBy: message.readBy || []
        });
      });

      return () => {
        socketService.removeAllListeners();
      };
    }
    return undefined; // Explicitly return undefined when no cleanup needed
  }, [currentUser]);

  return {
    chats,
    loading,
    error,
    loadChats,
    createChat,
    deleteChat,
    markChatAsRead,
  };
};

export default useChatsLogic;