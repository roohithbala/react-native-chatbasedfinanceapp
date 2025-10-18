import api from './apiConfig';

// Chat API
import { ChatResponse, Message, MessageResponse, MessagesResponse } from '../../app/types/chat';
import { isMessageResponse } from '../../app/utils/typeGuards';

export const chatAPIService = {
  getMessages: async (groupId: string, params?: any): Promise<MessagesResponse> => {
    try {
      const response = await api.get(`/chat/${groupId}/messages`, { params });

      // More flexible validation for messages response
      if (!response.data) {
        throw new Error('No response data from server');
      }

      // Check if response has the expected structure
      if (response.data.status === 'success' && response.data.data) {
        const { messages, group } = response.data.data;

        // Validate messages array
        if (!Array.isArray(messages)) {
          console.warn('Messages is not an array:', messages);
          return {
            status: 'success',
            data: {
              messages: [],
              group: group || undefined
            }
          };
        }

        // Validate each message has required fields
        const validMessages = messages.filter(msg =>
          msg &&
          typeof msg === 'object' &&
          msg.text &&
          msg.user &&
          msg._id
        );

        if (validMessages.length !== messages.length) {
          console.warn(`Filtered ${messages.length - validMessages.length} invalid messages`);
        }

        return {
          status: 'success',
          data: {
            messages: validMessages,
            group: group || undefined
          }
        };
      }

      // Handle alternative response formats
      if (response.data.messages && Array.isArray(response.data.messages)) {
        return {
          status: 'success',
          data: {
            messages: response.data.messages,
            group: response.data.group || undefined
          }
        };
      }

      console.warn('Unexpected messages response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  sendMessage: async (groupId: string, messageData: {
    text: string;
    type?: Message['type'];
    status?: Message['status'];
    mediaUrl?: string;
    mediaType?: Message['mediaType'];
    mediaSize?: number;
  }): Promise<MessageResponse> => {
    try {
      const response = await api.post(`/chat/${groupId}/messages`, messageData);
      if (!isMessageResponse(response.data)) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (groupId: string, messageIds: string[]): Promise<ChatResponse> => {
    try {
      const response = await api.put<ChatResponse>(`/chat/${groupId}/messages/read`, { messageIds });
      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  addReaction: async (groupId: string, messageId: string, emoji: string): Promise<ChatResponse> => {
    try {
      const response = await api.post<ChatResponse>(
        `/chat/${groupId}/messages/${messageId}/reactions`,
        { emoji }
      );
      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  },

// Direct Messages API
  getDirectMessages: async (userId: string): Promise<MessagesResponse> => {
    try {
      const response = await api.get(`/direct-messages/${userId}`);

      console.log('📥 Direct messages API response:', {
        count: response.data?.length,
        preview: response.data?.slice(0, 3).map((m: any) => ({
          id: m._id,
          text: m.text?.substring(0, 30),
          senderId: m.sender?._id,
          senderName: m.sender?.name,
          receiverId: m.receiver?._id,
          receiverName: m.receiver?.name
        }))
      });

      // Convert direct messages to the same format as group messages
      if (Array.isArray(response.data)) {
        const messages = response.data.map(msg => {
          // IMPORTANT: Keep sender and receiver intact for proper message alignment
          // The chat component will use sender._id to determine if message is from current user
          return {
            _id: msg._id,
            text: msg.text,
            createdAt: msg.createdAt,
            sender: msg.sender, // Keep full sender object
            receiver: msg.receiver, // Keep full receiver object
            user: msg.sender, // Legacy field for backward compatibility
            type: msg.type || 'text',
            status: msg.status || 'sent',
            groupId: undefined, // Direct messages don't have groupId
            readBy: msg.readBy || [],
            commandType: undefined,
            commandData: undefined,
            systemData: undefined,
            splitBillData: msg.splitBillData || undefined,
            mediaUrl: msg.mediaUrl || undefined,
            mediaType: msg.mediaType || undefined,
            mediaSize: msg.mediaSize || 0,
            mediaDuration: msg.mediaDuration || undefined,
            mediaWidth: msg.mediaWidth || undefined,
            mediaHeight: msg.mediaHeight || undefined,
            thumbnailUrl: msg.thumbnailUrl || undefined,
            fileName: msg.fileName || undefined,
            mimeType: msg.mimeType || undefined,
            mentions: msg.mentions || [],
            reactions: msg.reactions || []
          };
        });

        console.log('✅ Transformed messages:', {
          count: messages.length,
          preview: messages.slice(0, 3).map(m => ({
            id: m._id,
            text: m.text?.substring(0, 30),
            senderId: m.sender?._id,
            hasSender: !!m.sender,
            hasReceiver: !!m.receiver
          }))
        });

        return {
          status: 'success',
          data: {
            messages: messages.reverse(), // Direct messages come in reverse chronological order
            group: undefined
          }
        };
      }

      console.warn('Unexpected direct messages response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      throw error;
    }
  },

  sendDirectMessage: async (userId: string, messageData: {
    text: string;
    type?: Message['type'];
    splitBillData?: any;
  }): Promise<MessageResponse> => {
    try {
      const response = await api.post(`/direct-messages/${userId}`, messageData);

      // Convert direct message response to match group message format
      if (response.data && response.data._id) {
        const message = {
          _id: response.data._id,
          text: response.data.text,
          createdAt: response.data.createdAt,
          user: response.data.sender,
          type: response.data.type || 'text',
          status: response.data.status || 'sent',
          groupId: undefined,
          readBy: response.data.readBy || [],
          commandType: undefined,
          commandData: undefined,
          systemData: undefined,
          splitBillData: response.data.splitBillData || undefined,
          mediaUrl: response.data.mediaUrl || undefined,
          mediaType: response.data.mediaType || undefined,
          mediaSize: response.data.mediaSize || 0,
          mediaDuration: response.data.mediaDuration || undefined,
          mediaWidth: response.data.mediaWidth || undefined,
          mediaHeight: response.data.mediaHeight || undefined,
          thumbnailUrl: response.data.thumbnailUrl || undefined,
          fileName: response.data.fileName || undefined,
          mimeType: response.data.mimeType || undefined,
          mentions: response.data.mentions || [],
          reactions: response.data.reactions || []
        };

        return {
          status: 'success',
          data: {
            message
          }
        };
      }

      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Error sending direct message:', error);
      throw error;
    }
  },
  uploadImage: async (groupId: string, imageFile: any, caption?: string, isDirectChat?: boolean, userId?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (caption) {
        formData.append('caption', caption);
      }

      // Use direct message endpoint if it's a direct chat
      const endpoint = isDirectChat && userId 
        ? `/uploads/image/direct/${userId}`
        : `/uploads/image/${groupId}`;

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  uploadVideo: async (groupId: string, videoFile: any, caption?: string, isDirectChat?: boolean, userId?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (caption) {
        formData.append('caption', caption);
      }

      // Use direct message endpoint if it's a direct chat
      const endpoint = isDirectChat && userId 
        ? `/uploads/video/direct/${userId}`
        : `/uploads/video/${groupId}`;

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },

  uploadAudio: async (groupId: string, audioFile: any, caption?: string, isDirectChat?: boolean, userId?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (caption) {
        formData.append('caption', caption);
      }

      // Use direct message endpoint if it's a direct chat
      const endpoint = isDirectChat && userId 
        ? `/uploads/audio/direct/${userId}`
        : `/uploads/audio/${groupId}`;

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  },

  uploadDocument: async (groupId: string, documentFile: any, caption?: string, isDirectChat?: boolean, userId?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('document', documentFile);
      if (caption) {
        formData.append('caption', caption);
      }

      // Use direct message endpoint if it's a direct chat
      const endpoint = isDirectChat && userId 
        ? `/uploads/document/direct/${userId}`
        : `/uploads/document/${groupId}`;

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // User API
  getUserById: async (userId: string): Promise<any> => {
    try {
      const response = await api.get(`/users/${userId}`);
      if (response.data && response.data.user) {
        return response.data.user;
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Relationships API
  blockUser: async (userId: string): Promise<any> => {
    try {
      const response = await api.post(`/relationships/block/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  // Direct Messages API
  clearChat: async (userId: string): Promise<any> => {
    try {
      const response = await api.delete(`/direct-messages/${userId}/clear`);
      return response.data;
    } catch (error) {
      console.error('Error clearing chat:', error);
      throw error;
    }
  },

  // Delete a single message
  deleteMessage: async (messageId: string): Promise<any> => {
    try {
      const response = await api.delete(`/direct-messages/message/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Reports API
  reportUser: async (reportData: {
    reportedUserId: string;
    reportedUsername: string;
    reason: string;
    description?: string;
  }): Promise<any> => {
    try {
      const response = await api.post('/reports/user', reportData);
      return response.data;
    } catch (error) {
      console.error('Error reporting user:', error);
      throw error;
    }
  }
};

export default chatAPIService;