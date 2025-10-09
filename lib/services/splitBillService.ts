// Refactored Split Bill Service - Uses composition of smaller modules
import { SplitBillAPIOperations } from './SplitBillAPIOperations';

// Re-export types for backward compatibility
export type { Participant, SplitBill, CreateSplitBillParams, GetSplitBillsParams, SplitBillsResponse, SplitBillStats } from './SplitBillTypes';

class SplitBillService {
  static async getSplitBills(params?: any): Promise<any> {
    return SplitBillAPIOperations.getSplitBills(params);
  }

  static async getGroupSplitBills(groupId: string, page = 1, limit = 20): Promise<any> {
    return SplitBillAPIOperations.getGroupSplitBills(groupId, page, limit);
  }

  static async createSplitBill(data: any): Promise<any> {
    return SplitBillAPIOperations.createSplitBill(data);
  }

  static async getSplitBill(id: string): Promise<any> {
    return SplitBillAPIOperations.getSplitBill(id);
  }

  static async markAsPaid(id: string): Promise<any> {
    return SplitBillAPIOperations.markAsPaid(id);
  }

  static async rejectBill(id: string): Promise<any> {
    return SplitBillAPIOperations.rejectBill(id);
  }

  static async getStats(groupId?: string, period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    return SplitBillAPIOperations.getStats(groupId, period);
  }
}

export default SplitBillService;
