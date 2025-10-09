// Split Bill Types - Interfaces and type definitions
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