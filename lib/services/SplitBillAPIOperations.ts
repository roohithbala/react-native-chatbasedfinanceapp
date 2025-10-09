// Split Bill API Operations - API operations for split bills
import api from './apiConfig';
import { CreateSplitBillParams, GetSplitBillsParams, SplitBill, SplitBillsResponse, SplitBillStats } from './SplitBillTypes';
import { SplitBillValidator } from './SplitBillValidator';
import { SplitBillResponseParser } from './SplitBillResponseParser';

export class SplitBillAPIOperations {
  static async getSplitBills(params: GetSplitBillsParams = {}): Promise<SplitBillsResponse> {
    const response = await api.get('/split-bills', { params });
    return response.data;
  }

  static async getGroupSplitBills(groupId: string, page = 1, limit = 20): Promise<SplitBillsResponse> {
    try {
      SplitBillValidator.validateGroupId(groupId);

      const response = await api.get(`/split-bills/group/${groupId}`, {
        params: { page, limit }
      });

      return SplitBillResponseParser.parseGetGroupSplitBillsResponse(response.data, groupId);
    } catch (error: any) {
      console.error('Error in SplitBillAPIOperations.getGroupSplitBills:', error);

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
    console.log('SplitBillAPIOperations createSplitBill called with data:', JSON.stringify(data, null, 2));
    console.log('GroupId in data:', data.groupId, 'type:', typeof data.groupId);

    // Validate data before sending
    SplitBillValidator.validateCreateSplitBillData(data);

    try {
      const response = await api.post('/split-bills', data);
      console.log('SplitBillAPIOperations API response status:', response.status);
      console.log('SplitBillAPIOperations API response data:', JSON.stringify(response.data, null, 2));

      return SplitBillResponseParser.parseCreateSplitBillResponse(response.data);
    } catch (error: any) {
      console.error('SplitBillAPIOperations createSplitBill error:', error);

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
    SplitBillValidator.validateSplitBillId(id);

    const response = await api.get(`/split-bills/${id}`);
    return SplitBillResponseParser.parseGetSplitBillResponse(response.data);
  }

  static async markAsPaid(id: string): Promise<{ splitBill: SplitBill }> {
    try {
      SplitBillValidator.validateSplitBillId(id);

      const response = await api.patch(`/split-bills/${id}/mark-paid`);
      console.log('markAsPaid response:', response.data);

      return SplitBillResponseParser.parseMarkAsPaidResponse(response.data);
    } catch (error: any) {
      console.error('markAsPaid error:', error);
      throw error;
    }
  }

  static async rejectBill(id: string): Promise<{ splitBill: SplitBill }> {
    try {
      SplitBillValidator.validateSplitBillId(id);

      const response = await api.patch(`/split-bills/${id}/reject`);
      console.log('rejectBill response:', response.data);

      return SplitBillResponseParser.parseRejectBillResponse(response.data);
    } catch (error: any) {
      console.error('rejectBill error:', error);
      throw error;
    }
  }

  static async getStats(groupId?: string, period: 'week' | 'month' | 'year' = 'month'): Promise<SplitBillStats> {
    const response = await api.get('/split-bills/stats', {
      params: { groupId, period }
    });
    return response.data;
  }
}