import { create } from 'zustand';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { groupsAPI } from '../services/api';
import type { Group } from './types';

interface GroupsState {
  groups: Group[];
  selectedGroup: Group | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadGroups: () => Promise<void>;
  createGroup: (groupData: any) => Promise<void>;
  joinGroupByCode: (inviteCode: string) => Promise<void>;
  selectGroup: (group: Group) => void;
  generateInviteLink: (groupId: string) => string;
  addMemberToGroup: (groupId: string, identifier: string, searchType?: 'email' | 'username') => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,

  loadGroups: async () => {
    try {
      console.log('Loading groups from store...');
      set({ isLoading: true, error: null });
      const response = await groupsAPI.getGroups();
      console.log('Groups API response:', response);

      let groups: any[] = [];
      if (response && typeof response === 'object') {
        if ('groups' in response && Array.isArray(response.groups)) {
          groups = response.groups;
          console.log('Found groups in direct response:', groups.length);
        } else if ('data' in response && response.data && typeof response.data === 'object' && 'groups' in response.data && Array.isArray(response.data.groups)) {
          groups = response.data.groups;
          console.log('Found groups in data response:', groups.length);
        } else if (Array.isArray(response)) {
          groups = response;
          console.log('Response is array:', groups.length);
        }
      }

      console.log('Setting groups in store:', groups.length, 'groups');
      set({
        groups: groups,
        isLoading: false
      });

      console.log('Groups loaded successfully');
    } catch (error: any) {
      console.error('Load groups error:', error);
      let errorMessage = 'Failed to load groups';

      if (error.message === 'Network Error' || error.name === 'NetworkError' || !error.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and ensure the server is running.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Groups service not found. Please check server configuration.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({
        error: errorMessage,
        groups: [],
        isLoading: false
      });
    }
  },

  createGroup: async (groupData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await groupsAPI.createGroup(groupData);
      const group = response.group || response.data?.group;
      if (group) {
        set((state) => ({
          groups: [...(state.groups || []), group],
          isLoading: false
        }));
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to create group',
        isLoading: false
      });
      throw error;
    }
  },

  joinGroupByCode: async (inviteCode: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await groupsAPI.joinGroup(inviteCode);

      const group = response.group || response.data?.group || response.data?.data?.group;

      if (!group) {
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        groups: [...(state.groups || []), group],
        selectedGroup: group,
        isLoading: false,
        error: null
      }));

      Alert.alert('Success', 'Successfully joined the group!');
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to join group';
      set({
        error: errorMsg,
        isLoading: false
      });
      Alert.alert('Error', errorMsg);
      throw error;
    }
  },

  selectGroup: (group: Group) => {
    set({ selectedGroup: group });
  },

  generateInviteLink: (groupId: string) => {
    const groups = get().groups;
    const group = Array.isArray(groups) ? groups.find(g => g._id === groupId) : null;
    if (!group) return '';

    return `https://securefinance.app/join/${group.inviteCode}`;
  },

  addMemberToGroup: async (groupId: string, identifier: string, searchType: 'email' | 'username' = 'email') => {
    try {
      set({ isLoading: true, error: null });

      const response = await groupsAPI.addMember(groupId, identifier, searchType);

      if (!response || !response.group) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        groups: Array.isArray(state.groups) ? state.groups.map(group =>
          group._id === groupId ? response.group : group
        ) : [],
        selectedGroup: state.selectedGroup?._id === groupId
          ? response.group
          : state.selectedGroup,
        isLoading: false,
        error: null
      }));

      Alert.alert('Success', response.message || 'Member added successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add member';
      set({
        error: errorMsg,
        isLoading: false
      });
      Alert.alert('Error', errorMsg);
      throw error;
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));