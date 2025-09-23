import api from './api';
import { SplitBill } from '@/lib/store/financeStore';

export const splitBillAPI = {
  getSplitBills: async (params?: any) => {
    try {
      const response = await api.get('/split-bills', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching split bills:', error);
      throw error;
    }
  },

  createSplitBill: async (billData: Partial<SplitBill>) => {
    try {
      const response = await api.post('/split-bills', billData);
      return response.data;
    } catch (error) {
      console.error('Error creating split bill:', error);
      throw error;
    }
  },

  getSplitBill: async (id: string) => {
    try {
      const response = await api.get(`/split-bills/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching split bill:', error);
      throw error;
    }
  },

  markAsPaid: async (id: string) => {
    try {
      const response = await api.patch(`/split-bills/${id}/mark-paid`);
      return response.data;
    } catch (error) {
      console.error('Error marking split bill as paid:', error);
      throw error;
    }
  },

  getGroupSplitBills: async (groupId: string) => {
    try {
      const response = await api.get(`/split-bills/group/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group split bills:', error);
      throw error;
    }
  },

  getUserSplitBills: async (userId: string) => {
    try {
      const response = await api.get(`/split-bills/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user split bills:', error);
      throw error;
    }
  }
};

export default splitBillAPI;
