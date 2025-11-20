import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  receiver?: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  splitBillData?: any;
  createdAt: string;
  read: boolean;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system' | 'command' | 'split_bill';
  status?: 'sent' | 'delivered' | 'read' | 'error';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaSize?: number;
  mediaDuration?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  mentions?: string[];
  reactions?: any[];
}

class ChatAPIService {
  private async getAuthHeaders() {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      return headers;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  async getChatHistory(userId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/direct-messages/${userId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load chat history');
    }

    return response.json();
  }

  async sendMessage(userId: string, messageData: {
    text: string;
    type?: string;
    splitBillData?: any;
  }): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/direct-messages/${userId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  async markMessagesAsRead(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/direct-messages/${userId}/read`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark messages as read');
    }
  }

  async clearChat(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/direct-messages/${userId}/clear`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to clear chat');
    }
  }

  async getUserById(userId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  }

  async reportUser(reportData: {
    reportedUserId: string;
    reportedUsername: string;
    reason: string;
    description: string;
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reports/user`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      throw new Error('Failed to report user');
    }
  }

  async uploadMedia(userId: string, mediaData: {
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    mimeType?: string;
  }, caption?: string): Promise<Message> {
    const formData = new FormData();
    
    // Create file object for upload
    const file = {
      uri: mediaData.uri,
      type: mediaData.mimeType || 'application/octet-stream',
      name: mediaData.fileName || `file-${Date.now()}`,
    };
    
    formData.append('file', file as any);
    if (caption) {
      formData.append('caption', caption);
    }

    // For FormData, don't set Content-Type header manually
    const headers = await this.getAuthHeaders();
    delete headers['Content-Type'];

    const response = await fetch(`${API_BASE_URL}/uploads/${mediaData.type}/direct/${userId}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    return response.json();
  }
}

export const chatAPIService = new ChatAPIService();

// Default export to satisfy Expo Router (this is a service file, not a component)
export default chatAPIService;