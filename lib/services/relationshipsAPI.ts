import api from './api';

export class RelationshipsAPI {
  static async blockUser(userId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/block/${userId}`);
    return response.data;
  }

  static async unblockUser(userId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/unblock/${userId}`);
    return response.data;
  }

  static async muteChat(userId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/mute/chat/${userId}`);
    return response.data;
  }

  static async unmuteChat(userId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/unmute/chat/${userId}`);
    return response.data;
  }

  static async muteGroup(groupId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/mute/group/${groupId}`);
    return response.data;
  }

  static async unmuteGroup(groupId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/unmute/group/${groupId}`);
    return response.data;
  }

  static async archiveChat(userId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/archive/chat/${userId}`);
    return response.data;
  }

  static async unarchiveChat(userId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/unarchive/chat/${userId}`);
    return response.data;
  }

  static async archiveGroup(groupId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/archive/group/${groupId}`);
    return response.data;
  }

  static async unarchiveGroup(groupId: string): Promise<{ message: string }> {
    const response = await api.post(`/relationships/unarchive/group/${groupId}`);
    return response.data;
  }

  static async getRelationships(): Promise<{
    blockedUsers: any[];
    mutedChats: any[];
    mutedGroups: any[];
    archivedChats: any[];
    archivedGroups: any[];
  }> {
    const response = await api.get('/relationships/relationships');
    return response.data;
  }
}

export default RelationshipsAPI;