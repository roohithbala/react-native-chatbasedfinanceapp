import api from './apiConfig';
import { authAPI } from './AuthAPI';

// Groups API
export const groupsAPI = {
  getGroups: async () => {
    try {
      const response = await api.get('/groups');
      if (!response.data) {
        throw new Error('No response data from server');
      }

      // Handle various response formats - backend returns { status: 'success', data: { groups } }
      const groups = response.data.data?.groups || response.data.groups || response.data;
      return {
        groups: Array.isArray(groups) ? groups : []
      };
    } catch (error: any) {
      console.error('Error fetching groups:', error);

      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for groups API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw error;
    }
  },

  createGroup: async (groupData: any) => {
    try {
      const response = await api.post('/groups', groupData);
      if (!response.data || response.data.status !== 'success' || !response.data.data?.group) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  getGroup: async (id: string) => {
    try {
      const response = await api.get(`/groups/${id}`);
      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Get group error:', error);
      throw error;
    }
  },

  addMember: async (groupId: string, identifier: string, searchType: 'email' | 'username' = 'email') => {
    try {
      if (!identifier?.trim()) {
        throw new Error(`${searchType === 'email' ? 'Email' : 'Username'} is required`);
      }

      const requestBody = searchType === 'email'
        ? { email: identifier.trim() }
        : { username: identifier.trim() };

      const response = await api.post(`/groups/${groupId}/members`, requestBody);

      // More flexible validation - handle various response formats
      if (!response.data) {
        throw new Error('No response data from server');
      }

      // Handle error responses first
      if (response.data.status === 'error' || (response.data.message && response.data.status !== 'success')) {
        console.warn('Server returned error for add member:', response.data.message);
        throw new Error(response.data.message || 'Failed to add member');
      }

      // Check for success status and data
      if (response.data.status === 'success' && response.data.data) {
        // Backend returns: { status: 'success', data: { message: '...', group: {...} } }
        // Return the data object which contains both message and group
        return response.data.data;
      }

      // Handle alternative response formats
      if (response.data.group) {
        return { group: response.data.group };
      }

      // Handle direct group response
      if (response.data.status === 'success' && response.data.group) {
        return { group: response.data.group };
      }

      // If we get here, the response format is unexpected
      console.warn('Unexpected add member response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  },

  splitBill: async (groupId: string, billData: any) => {
    try {
      const response = await api.post(`/groups/${groupId}/split`, billData);
      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error splitting bill:', error);
      throw error;
    }
  },

  joinGroup: async (inviteCode: string) => {
    try {
      const response = await api.post(`/groups/join/${inviteCode}`);
      console.log('Join group response:', response.data);
      
      if (!response.data) {
        throw new Error('No response data from server');
      }

      // Handle success response
      if (response.data.status === 'success') {
        // Check for various response formats
        if (response.data.data?.group) {
          return response.data; // Format: { status: 'success', data: { group } }
        }
        if (response.data.group) {
          return { data: { group: response.data.group } }; // Format: { status: 'success', group }
        }
        if (response.data.data) {
          return response.data; // Format: { status: 'success', data: {...} }
        }
        // Return as-is if success but unexpected format
        return response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Failed to join group');
      }

      // If no status field, try to return what we got
      if (response.data.group) {
        return { data: { group: response.data.group } };
      }

      console.warn('Unexpected join group response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Join group error:', error);
      throw error;
    }
  },

  generateInviteCode: async (groupId: string) => {
    try {
      const response = await api.post(`/groups/${groupId}/invite-code`);
      if (!response.data || response.data.status !== 'success' || !response.data.data?.inviteCode) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Generate invite code error:', error);
      throw error;
    }
  },

  getGroupStats: async (groupId: string) => {
    try {
      const response = await api.get(`/groups/${groupId}/stats`);
      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Get group stats error:', error);
      throw error;
    }
  },

  updateGroupInfo: async (groupId: string, groupData: any) => {
    try {
      console.log('Calling updateGroupInfo with:', { groupId, groupData });
      const response = await api.put(`/groups/${groupId}`, groupData);
      console.log('updateGroupInfo response:', response.data);
      console.log('Response status:', response.status);

      if (!response.data) {
        throw new Error('No response data from server');
      }

      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Server returned an error');
      }

      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Update group info error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  updateGroupSettings: async (groupId: string, settings: any) => {
    try {
      console.log('Calling updateGroupSettings with:', { groupId, settings });
      console.log('Settings object type:', typeof settings);
      console.log('Settings keys:', Object.keys(settings || {}));

      const requestData = { settings };
      console.log('Request data being sent:', JSON.stringify(requestData, null, 2));

      // Get current user for debugging
      try {
        const currentUser = await authAPI.getCurrentUser();
        console.log('Current user from API:', currentUser);
      } catch (userError) {
        console.warn('Could not get current user for debugging:', userError);
      }

      const response = await api.put(`/groups/${groupId}/settings`, requestData);
      console.log('updateGroupSettings response:', response.data);
      console.log('Response status:', response.status);

      if (!response.data) {
        throw new Error('No response data from server');
      }

      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        console.error('Server returned error status:', response.data.message);
        throw new Error(response.data.message || 'Server returned an error');
      }

      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Update group settings error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // Safely log error config if it exists
      if (error.config) {
        console.error('Error config:', error.config);
        console.error('Request URL:', error.config.url);
        console.error('Request method:', error.config.method);
        console.error('Request data:', error.config.data);
      } else {
        console.error('Error config: undefined (not an AxiosError)');
      }

      // Check if this is a network error or other non-Axios error
      if (!error.response) {
        console.error('Network or other error (no response object):', error.message);
        throw new Error('Network error or server unreachable. Please check your connection.');
      }

      throw error;
    }
  },

  updateNotificationSettings: async (groupId: string, notifications: any) => {
    try {
      console.log('Calling updateNotificationSettings with:', { groupId, notifications });
      const response = await api.put(`/groups/${groupId}/notifications`, { notifications });
      console.log('updateNotificationSettings response:', response.data);
      console.log('Response status:', response.status);

      if (!response.data) {
        throw new Error('No response data from server');
      }

      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Server returned an error');
      }

      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Update notification settings error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  makeMemberAdmin: async (groupId: string, memberId: string) => {
    try {
      const response = await api.put(`/groups/${groupId}/members/${memberId}/role`, { role: 'admin' });
      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Make member admin error:', error);
      throw error;
    }
  },

  demoteMember: async (groupId: string, memberId: string) => {
    try {
      console.log('Attempting to demote member:', { groupId, memberId });
      const response = await api.put(`/groups/${groupId}/members/${memberId}/demote`);
      console.log('Demote member response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);

      // More flexible validation - handle various response formats
      if (!response.data) {
        console.error('No response data from demote member API');
        throw new Error('No response data from server');
      }

      // Check for success status
      if (response.data.status === 'success') {
        console.log('Member demoted successfully');
        // Return the data object which contains message and group
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        console.error('Server returned error:', response.data.message);
        // Provide more user-friendly error messages
        let errorMessage = response.data.message || 'Server returned an error';
        if (errorMessage.includes('Cannot demote the last admin')) {
          errorMessage = 'Cannot demote the last admin. Promote another member to admin first.';
        }
        throw new Error(errorMessage);
      }

      // If we get here, the response format is unexpected
      console.warn('Unexpected demote member response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error('Demote member error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  removeMember: async (groupId: string, memberId: string) => {
    try {
      console.log('Attempting to remove member:', { groupId, memberId });
      const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
      console.log('Remove member response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);

      // More flexible validation - handle various response formats
      if (!response.data) {
        console.error('No response data from remove member API');
        throw new Error('No response data from server');
      }

      // Check for success status
      if (response.data.status === 'success') {
        console.log('Member removed successfully');
        // Return the data object which contains message and group
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        console.error('Server returned error:', response.data.message);
        // Provide more user-friendly error messages
        let errorMessage = response.data.message || 'Server returned an error';
        if (errorMessage.includes('Cannot remove admin members')) {
          errorMessage = 'Cannot remove admin members. Groups must have at least one admin. Make another member an admin first.';
        }
        throw new Error(errorMessage);
      }

      // If we get here, the response format is unexpected
      console.warn('Unexpected remove member response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error('Remove member error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  leaveGroup: async (groupId: string) => {
    try {
      console.log('Calling leaveGroup for groupId:', groupId);
      const response = await api.delete(`/groups/${groupId}/leave`);
      console.log('leaveGroup response:', response.data);
      console.log('Response status:', response.status);
      
      if (!response.data) {
        throw new Error('No response data from server');
      }

      // Handle success response
      if (response.data.status === 'success') {
        return response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Failed to leave group');
      }

      // If no status field, log the unexpected format
      console.warn('Unexpected leave group response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error('Leave group error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  updateGroup: async (groupId: string, groupData: any) => {
    try {
      console.log('Calling updateGroup with:', { groupId, groupData });
      const response = await api.put(`/groups/${groupId}`, groupData);
      console.log('updateGroup response:', response.data);
      console.log('Response status:', response.status);

      if (!response.data) {
        throw new Error('No response data from server');
      }

      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Server returned an error');
      }

      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Update group error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  deleteGroup: async (groupId: string) => {
    try {
      console.log('Calling deleteGroup with:', { groupId });
      const response = await api.delete(`/groups/${groupId}`);
      console.log('deleteGroup response:', response.data);
      console.log('Response status:', response.status);

      if (!response.data) {
        throw new Error('No response data from server');
      }

      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Server returned an error');
      }

      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Delete group error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },
};