import axios from './api';

export interface Participant {
  userId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: Date;
}

export interface SplitBill {
  _id: string;
  description: string;
  totalAmount: number;
  groupId?: string; // Made optional for direct chat split bills
  createdBy: {
    _id: string;
    name: string;
    avatar?: string;
  };
  participants: (Participant & {
    userId: {
      _id: string;
      name: string;
      avatar?: string;
    };
  })[];
  splitType: 'equal' | 'custom' | 'percentage' | 'itemized';
  category: string;
  currency: string;
  notes?: string;
  isSettled: boolean;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSplitBillParams {
  description: string;
  totalAmount: number;
  groupId?: string; // Made optional for direct chat split bills
  participants: {
    userId: string;
    amount: number;
  }[];
  splitType?: 'equal' | 'custom' | 'percentage' | 'itemized';
  category?: string;
  currency?: string;
  notes?: string;
}

export interface GetSplitBillsParams {
  page?: number;
  limit?: number;
  groupId?: string;
  status?: 'pending' | 'paid' | 'all';
}

export interface SplitBillsResponse {
  splitBills: SplitBill[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface SplitBillStats {
  overview: {
    totalAmount: number;
    count: number;
    settled: number;
    pending: number;
  };
  byCategory: {
    _id: string;
    amount: number;
    count: number;
  }[];
  byGroup: {
    _id: string;
    amount: number;
    count: number;
    groupName: string;
  }[];
}

class SplitBillService {
  static async getSplitBills(params: GetSplitBillsParams = {}): Promise<SplitBillsResponse> {
    const response = await axios.get('/split-bills', { params });
    return response.data;
  }

  static async getGroupSplitBills(groupId: string, page = 1, limit = 20): Promise<SplitBillsResponse> {
    try {
      const response = await axios.get(`/split-bills/group/${groupId}`, {
        params: { page, limit }
      });
      
      // Handle 403 Forbidden errors gracefully
      if (response.status === 403) {
        console.log(`Group split bills access restricted for group ${groupId}`);
        return {
          splitBills: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }
      
      // Validate response structure for successful responses
      if (!response.data || !response.data.splitBills) {
        console.warn('Invalid response structure from split bills API:', response.data);
        return {
          splitBills: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error in SplitBillService.getGroupSplitBills:', error);
      
      // Check if it's an axios error with response
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // Handle 403 errors in the catch block as well (in case axios rejects them)
        if (error.response.status === 403) {
          console.log(`Group split bills access restricted for group ${groupId}`);
          return {
            splitBills: [],
            totalPages: 0,
            currentPage: 1,
            total: 0
          };
        }
        
        // Handle other HTTP errors
        if (error.response.data?.message) {
          throw new Error(error.response.data.message);
        }
      } else if (error.request) {
        // Network error - no response received
        console.error('Network error - no response received:', error.request);
        throw new Error('Network error. Please check your internet connection.');
      } else {
        // Something else happened
        console.error('Unexpected error:', error.message);
        throw new Error(error.message || 'An unexpected error occurred');
      }
      
      throw error;
    }
  }

  static async createSplitBill(data: CreateSplitBillParams): Promise<{ splitBill: SplitBill }> {
    console.log('SplitBillService createSplitBill called with data:', JSON.stringify(data, null, 2));
    console.log('GroupId in data:', data.groupId, 'type:', typeof data.groupId);
    
    // Validate data before sending
    if (!data.description || !data.description.trim()) {
      throw new Error('Description is required');
    }
    if (!data.totalAmount || data.totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }
    if (!data.participants || !Array.isArray(data.participants) || data.participants.length === 0) {
      throw new Error('At least one participant is required');
    }
    
    // Validate participants
    for (const participant of data.participants) {
      if (!participant.userId || !participant.amount || participant.amount <= 0) {
        throw new Error('Each participant must have a valid userId and amount greater than 0');
      }
    }
    
    // Validate total amount matches sum of participant amounts
    const totalParticipantAmount = data.participants.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(data.totalAmount - totalParticipantAmount) > 0.01) {
      console.warn('Amount mismatch:', { totalAmount: data.totalAmount, participantSum: totalParticipantAmount });
      throw new Error(`Total amount (${data.totalAmount}) must equal sum of participant amounts (${totalParticipantAmount})`);
    }
    
    try {
      const response = await axios.post('/split-bills', data);
      console.log('SplitBillService API response status:', response.status);
      console.log('SplitBillService API response data:', JSON.stringify(response.data, null, 2));
      console.log('SplitBillService API response data keys:', response.data ? Object.keys(response.data) : 'No data');

      // Handle backend response format: { message: '...', splitBill }
      if (response.data && response.data.splitBill) {
        console.log('Found splitBill in response.data.splitBill');
        return { splitBill: response.data.splitBill };
      }

      // Handle alternative format: { splitBill } directly
      if (response.data && response.data._id) {
        console.log('Found splitBill directly in response.data');
        return { splitBill: response.data };
      }

      // Handle format: { message: '...', data: splitBill }
      if (response.data && response.data.data && response.data.data._id) {
        console.log('Found splitBill in response.data.data');
        return { splitBill: response.data.data };
      }

      // Handle error responses
      if (response.data && response.data.message && !response.data.splitBill) {
        console.error('Backend returned error message:', response.data.message);
        throw new Error(response.data.message);
      }

      console.error('Unexpected response format:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('SplitBillService createSplitBill error:', error);
      
      // Check if it's an axios error with response
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // If it's a backend error with a message, throw that message
        if (error.response.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        // Handle specific HTTP status codes
        if (error.response.status === 400) {
          throw new Error('Invalid data provided. Please check your input.');
        } else if (error.response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (error.response.status === 403) {
          throw new Error('You do not have permission to create split bills in this group.');
        } else if (error.response.status === 404) {
          throw new Error('Group not found.');
        }
      } else if (error.request) {
        // Network error - no response received
        console.error('Network error - no response received:', error.request);
        throw new Error('Network error. Please check your internet connection.');
      } else {
        // Something else happened
        console.error('Unexpected error:', error.message);
        throw new Error(error.message || 'Server error');
      }
      
      throw error;
    }
  }

  static async getSplitBill(id: string): Promise<{ splitBill: SplitBill }> {
    const response = await axios.get(`/split-bills/${id}`);
    
    // Handle backend response format: { splitBill }
    if (response.data && response.data.splitBill) {
      return { splitBill: response.data.splitBill };
    }
    
    // Fallback for unexpected response format
    throw new Error('Invalid response from server');
  }

  static async markAsPaid(id: string): Promise<{ splitBill: SplitBill }> {
    try {
      const response = await axios.patch(`/split-bills/${id}/mark-paid`);
      console.log('markAsPaid response:', response.data);
      
      // Handle various response formats from backend
      if (response.data && response.data.splitBill) {
        return { splitBill: response.data.splitBill };
      }
      
      // Handle format: { message: '...', data: splitBill }
      if (response.data && response.data.data) {
        return { splitBill: response.data.data };
      }
      
      // Handle direct splitBill response
      if (response.data && response.data._id) {
        return { splitBill: response.data };
      }
      
      // Handle error responses that contain only a message
      if (response.data && response.data.message && !response.data.splitBill) {
        console.error('Backend returned error message:', response.data.message);
        throw new Error(response.data.message);
      }
      
      console.error('Unexpected markAsPaid response format:', response.data);
      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('markAsPaid error:', error);
      throw error;
    }
  }

  static async rejectBill(id: string): Promise<{ splitBill: SplitBill }> {
    try {
      const response = await axios.patch(`/split-bills/${id}/reject`);
      console.log('rejectBill response:', response.data);
      
      // Handle various response formats from backend
      if (response.data && response.data.splitBill) {
        return { splitBill: response.data.splitBill };
      }
      
      // Handle format: { message: '...', data: splitBill }
      if (response.data && response.data.data) {
        return { splitBill: response.data.data };
      }
      
      // Handle direct splitBill response
      if (response.data && response.data._id) {
        return { splitBill: response.data };
      }
      
      console.error('Unexpected rejectBill response format:', response.data);
      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('rejectBill error:', error);
      throw error;
    }
  }

  static async getStats(groupId?: string, period: 'week' | 'month' | 'year' = 'month'): Promise<SplitBillStats> {
    const response = await axios.get('/split-bills/stats', {
      params: { groupId, period }
    });
    return response.data;
  }
}

export default SplitBillService;
