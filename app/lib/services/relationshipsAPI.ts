import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.120.178.172:3001/api';

class RelationshipsAPI {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async blockUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/block/${userId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to block user');
    }
  }

  async unblockUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/unblock/${userId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unblock user');
    }
  }

  async muteChat(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/mute/chat/${userId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mute chat');
    }
  }

  async unmuteChat(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/unmute/chat/${userId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unmute chat');
    }
  }

  async muteGroup(groupId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/mute/group/${groupId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mute group');
    }
  }

  async unmuteGroup(groupId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/unmute/group/${groupId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unmute group');
    }
  }

  async archiveChat(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/archive/chat/${userId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to archive chat');
    }
  }

  async unarchiveChat(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/unarchive/chat/${userId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unarchive chat');
    }
  }

  async archiveGroup(groupId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/archive/group/${groupId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to archive group');
    }
  }

  async unarchiveGroup(groupId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/relationships/unarchive/group/${groupId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unarchive group');
    }
  }

  async getRelationships(): Promise<{
    blockedUsers: any[];
    mutedChats: any[];
    mutedGroups: any[];
    archivedChats: any[];
    archivedGroups: any[];
  }> {
    const response = await fetch(`${API_BASE_URL}/relationships/relationships`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get relationships');
    }

    return response.json();
  }
}

export default new RelationshipsAPI();