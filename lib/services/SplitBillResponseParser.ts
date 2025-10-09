// Split Bill Response Parser - Handles API response parsing and formatting
import { SplitBill, SplitBillsResponse } from './SplitBillTypes';

export class SplitBillResponseParser {
  static parseCreateSplitBillResponse(responseData: any): { splitBill: SplitBill } {
    console.log('Parsing create split bill response:', JSON.stringify(responseData, null, 2));

    // Handle backend response format: { message: '...', splitBill }
    if (responseData && responseData.splitBill) {
      console.log('Found splitBill in responseData.splitBill');
      return { splitBill: responseData.splitBill };
    }

    // Handle alternative format: { splitBill } directly
    if (responseData && responseData._id) {
      console.log('Found splitBill directly in responseData');
      return { splitBill: responseData };
    }

    // Handle format: { message: '...', data: splitBill }
    if (responseData && responseData.data && responseData.data._id) {
      console.log('Found splitBill in responseData.data');
      return { splitBill: responseData.data };
    }

    // Handle error responses
    if (responseData && responseData.message && !responseData.splitBill) {
      console.error('Backend returned error message:', responseData.message);
      throw new Error(responseData.message);
    }

    console.error('Unexpected response format:', JSON.stringify(responseData, null, 2));
    throw new Error('Invalid response from server');
  }

  static parseGetSplitBillResponse(responseData: any): { splitBill: SplitBill } {
    // Handle backend response format: { splitBill }
    if (responseData && responseData.splitBill) {
      return { splitBill: responseData.splitBill };
    }

    // Fallback for unexpected response format
    throw new Error('Invalid response from server');
  }

  static parseMarkAsPaidResponse(responseData: any): { splitBill: SplitBill } {
    console.log('Parsing mark as paid response:', responseData);

    // Handle various response formats from backend
    if (responseData && responseData.splitBill) {
      return { splitBill: responseData.splitBill };
    }

    // Handle format: { message: '...', data: splitBill }
    if (responseData && responseData.data) {
      return { splitBill: responseData.data };
    }

    // Handle direct splitBill response
    if (responseData && responseData._id) {
      return { splitBill: responseData };
    }

    // Handle error responses that contain only a message
    if (responseData && responseData.message && !responseData.splitBill) {
      console.error('Backend returned error message:', responseData.message);
      throw new Error(responseData.message);
    }

    console.error('Unexpected markAsPaid response format:', responseData);
    throw new Error('Invalid response from server');
  }

  static parseRejectBillResponse(responseData: any): { splitBill: SplitBill } {
    console.log('Parsing reject bill response:', responseData);

    // Handle various response formats from backend
    if (responseData && responseData.splitBill) {
      return { splitBill: responseData.splitBill };
    }

    // Handle format: { message: '...', data: splitBill }
    if (responseData && responseData.data) {
      return { splitBill: responseData.data };
    }

    // Handle direct splitBill response
    if (responseData && responseData._id) {
      return { splitBill: responseData };
    }

    console.error('Unexpected rejectBill response format:', responseData);
    throw new Error('Invalid response from server');
  }

  static parseGetGroupSplitBillsResponse(responseData: any, groupId: string): SplitBillsResponse {
    // Handle 403 Forbidden errors gracefully
    if (responseData && responseData.status === 403) {
      console.log(`Group split bills access restricted for group ${groupId}`);
      return {
        splitBills: [],
        totalPages: 0,
        currentPage: 1,
        total: 0
      };
    }

    // Validate response structure for successful responses
    if (!responseData || !responseData.splitBills) {
      console.warn('Invalid response structure from split bills API:', responseData);
      return {
        splitBills: [],
        totalPages: 0,
        currentPage: 1,
        total: 0
      };
    }

    return responseData;
  }
}