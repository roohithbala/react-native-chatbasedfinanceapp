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
  participants: Array<Participant & {
    userId: {
      _id: string;
      name: string;
      avatar?: string;
    };
  }>;
  splitType: 'equal' | 'custom' | 'percentage';
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
  participants: Array<{
    userId: string;
    amount: number;
  }>;
  splitType?: 'equal' | 'custom' | 'percentage';
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
  byCategory: Array<{
    _id: string;
    amount: number;
    count: number;
  }>;
  byGroup: Array<{
    _id: string;
    amount: number;
    count: number;
    groupName: string;
  }>;
}

class SplitBillService {
  static async getSplitBills(params: GetSplitBillsParams = {}): Promise<SplitBillsResponse> {
    const response = await axios.get('/split-bills', { params });
    return response.data;
  }

  static async getGroupSplitBills(groupId: string, page = 1, limit = 20): Promise<SplitBillsResponse> {
    const response = await axios.get(`/split-bills/group/${groupId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  static async createSplitBill(data: CreateSplitBillParams): Promise<{ splitBill: SplitBill }> {
    const response = await axios.post('/split-bills', data);
    return response.data;
  }

  static async getSplitBill(id: string): Promise<{ splitBill: SplitBill }> {
    const response = await axios.get(`/split-bills/${id}`);
    return response.data;
  }

  static async markAsPaid(id: string): Promise<{ splitBill: SplitBill }> {
    const response = await axios.patch(`/split-bills/${id}/mark-paid`);
    return response.data;
  }

  static async getStats(groupId?: string, period: 'week' | 'month' | 'year' = 'month'): Promise<SplitBillStats> {
    const response = await axios.get('/split-bills/stats', {
      params: { groupId, period }
    });
    return response.data;
  }
}

export default SplitBillService;
