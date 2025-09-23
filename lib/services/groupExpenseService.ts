import { SplitBill } from './splitBillService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  GroupExpense, 
  GroupExpenseParticipant,
  GroupExpenseStats
} from '@/app/types/groupExpense';
import { default as api } from './api';
import type { AxiosInstance } from 'axios';

// Type assertion to ensure api is treated as AxiosInstance
const typedApi: AxiosInstance = api as any;

export interface GroupExpenseWithSplitBills extends GroupExpense {
  splitBills: SplitBill[];
}

class GroupExpenseService {
  // Convert split bill to group expense
  static splitBillToGroupExpense(splitBill: SplitBill): GroupExpense {
    return {
      _id: splitBill._id,
      description: splitBill.description,
      amount: splitBill.totalAmount,
      category: splitBill.category,
      groupId: splitBill.groupId, // Now optional
      paidBy: splitBill.createdBy._id,
      participants: splitBill.participants.map(p => ({
        userId: (p.userId && typeof p.userId === 'object') ? (p.userId as any)._id : p.userId as string,
        amount: p.amount,
        isPaid: p.isPaid,
        paidAt: p.paidAt
      })),
      currency: splitBill.currency,
      createdAt: new Date(splitBill.createdAt),
      updatedAt: new Date(splitBill.updatedAt)
    };
  }

  // Get all group expenses including split bills
  static async getGroupExpenses(groupId: string): Promise<GroupExpenseWithSplitBills[]> {
    try {
      // Use the typed api instance
      
      const [expensesResponse, splitBillsResponse] = await Promise.all([
        typedApi.get(`/groups/${groupId}/expenses`),
        typedApi.get(`/split-bills/group/${groupId}`)
      ]);
      
      const expenses = Array.isArray(expensesResponse.data?.data?.expenses) 
        ? expensesResponse.data.data.expenses 
        : [];
      const splitBills = Array.isArray(splitBillsResponse.data?.data?.splitBills) 
        ? splitBillsResponse.data.data.splitBills 
        : [];
      
      return expenses.map((expense: GroupExpense) => {
        const relatedSplitBills = splitBills.filter(
          (bill: SplitBill) => bill._id === expense._id
        );
        return {
          ...expense,
          splitBills: relatedSplitBills
        };
      });
    } catch (error) {
      console.error('Error fetching group expenses:', error);
      return [];
    }
  }

  // Get expense details with split bill info
  static async getExpenseDetails(groupId: string, expenseId: string): Promise<GroupExpenseWithSplitBills> {
    try {
      // Use the typed api instance
      
      const [expenseResponse, splitBillResponse] = await Promise.all([
        typedApi.get(`/groups/${groupId}/expenses/${expenseId}`),
        typedApi.get(`/split-bills/${expenseId}`)
      ]);
      
      const expense = expenseResponse.data?.data?.expense || expenseResponse.data?.data;
      const splitBill = splitBillResponse.data?.data?.splitBill || splitBillResponse.data?.data;
      
      return {
        ...expense,
        splitBills: splitBill ? [splitBill] : []
      };
    } catch (error) {
      console.error('Error fetching expense details:', error);
      throw error;
    }
  }

  // Create a new group expense and optionally create split bill
  static async createGroupExpense(
    groupId: string, 
    expenseData: Omit<GroupExpense, '_id'>,
    createSplitBill: boolean = false
  ): Promise<GroupExpenseWithSplitBills> {
    try {
      // Use the typed api instance
      
      // First create the expense
      const expenseResponse = await typedApi.post(`/groups/${groupId}/expenses`, expenseData);
      const expense = expenseResponse.data?.data?.expense || expenseResponse.data?.data;
      
      // If split bill is requested, create it
      if (createSplitBill) {
        const splitBillData = {
          description: expenseData.description,
          totalAmount: expenseData.amount,
          groupId,
          participants: expenseData.participants.map((p: GroupExpenseParticipant) => ({
            userId: p.userId,
            amount: p.amount
          })),
          category: expenseData.category,
          currency: expenseData.currency || 'INR'
        };

        const splitBillResponse = await typedApi.post('/split-bills', splitBillData);
        const splitBill = splitBillResponse.data?.data?.splitBill || splitBillResponse.data?.data;

        return {
          ...expense,
          splitBills: [splitBill]
        };
      }

      return {
        ...expense,
        splitBills: []
      };
    } catch (error) {
      console.error('Error creating group expense:', error);
      throw error;
    }
  }

  // Update group expense and related split bill
  static async updateGroupExpense(
    groupId: string,
    expenseId: string,
    updates: Partial<GroupExpense>
  ): Promise<GroupExpenseWithSplitBills> {
    try {
      // Use the typed api instance
      
      // Update the expense
      const expenseResponse = await typedApi.patch(`/groups/${groupId}/expenses/${expenseId}`, updates);
      const expense = expenseResponse.data?.data?.expense || expenseResponse.data?.data;

      // Check if there's a related split bill and update it
      try {
        const splitBillResponse = await typedApi.get(`/split-bills/${expenseId}`);
        const splitBill = splitBillResponse.data?.data?.splitBill || splitBillResponse.data?.data;
        
        if (splitBill) {
          const splitBillUpdates = {
            description: updates.description,
            totalAmount: updates.amount,
            category: updates.category,
            participants: updates.participants?.map((p: GroupExpenseParticipant) => ({
              userId: p.userId,
              amount: p.amount
            }))
          };

          const updatedSplitBillResponse = await typedApi.patch(`/split-bills/${expenseId}`, splitBillUpdates);
          const updatedSplitBill = updatedSplitBillResponse.data?.data?.splitBill || updatedSplitBillResponse.data?.data;

          return {
            ...expense,
            splitBills: [updatedSplitBill]
          };
        }
      } catch (splitBillError) {
        console.log('No split bill found for expense:', expenseId);
      }

      return {
        ...expense,
        splitBills: []
      };
    } catch (error) {
      console.error('Error updating group expense:', error);
      throw error;
    }
  }

  // Mark an expense as paid by a participant
  static async markAsPaid(
    groupId: string, 
    expenseId: string, 
    userId: string
  ): Promise<GroupExpenseWithSplitBills> {
    try {
      // Use the typed api instance
      
      // Mark the expense as paid
      const expenseResponse = await typedApi.patch(`/groups/${groupId}/expenses/${expenseId}/mark-paid`, { userId });
      const expense = expenseResponse.data?.data?.expense || expenseResponse.data?.data;

      // Also mark the split bill as paid if it exists
      try {
        const splitBillResponse = await typedApi.patch(`/split-bills/${expenseId}/mark-paid`);
        const splitBill = splitBillResponse.data?.data?.splitBill || splitBillResponse.data?.data;

        return {
          ...expense,
          splitBills: [splitBill]
        };
      } catch (splitBillError) {
        console.log('No split bill found for expense:', expenseId);
        // If there's no split bill, return just the expense
        return {
          ...expense,
          splitBills: []
        };
      }
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      throw error;
    }
  }

  // Get expense statistics for a group
  static async getGroupExpenseStats(
    groupId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ) {
    try {
      // Use the typed api instance
      
      // Try to get group stats from the backend endpoint
      try {
        const statsResponse = await typedApi.get(`/groups/${groupId}/stats`);
        if (statsResponse.data && statsResponse.data.status === 'success') {
          return statsResponse.data.data;
        }
      } catch (error) {
        console.log('Group stats endpoint not available, using fallback method');
      }
      
      // Fallback: Try to get group data and split bills separately
      const groupResponse = await typedApi.get(`/groups/${groupId}`);
      const groupData = groupResponse.data;
      
      // Try to get split bills for the group
      let splitBills = [];
      try {
        const splitBillResponse = await typedApi.get(`/split-bills`, {
          params: { groupId, limit: 100 }
        });
        splitBills = Array.isArray(splitBillResponse.data) ? splitBillResponse.data : 
                    (splitBillResponse.data?.bills || []);
      } catch (error) {
        console.log('No split bills found for group:', error);
      }
      
      // Calculate stats from split bills
      const totalAmount = splitBills.reduce((sum: number, bill: any) => sum + (bill.totalAmount || 0), 0);
      const count = splitBills.length;
      const settled = splitBills.filter((bill: any) => bill.isSettled).length;
      const pending = count - settled;
      
      // Group by category
      const categoryMap = new Map();
      splitBills.forEach((bill: any) => {
        const category = bill.category || 'Other';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { category, amount: 0, count: 0 });
        }
        const categoryData = categoryMap.get(category);
        categoryData.amount += bill.totalAmount || 0;
        categoryData.count += 1;
      });
      
      // Group by participant
      const participantMap = new Map();
      splitBills.forEach((bill: any) => {
        if (bill.participants && Array.isArray(bill.participants)) {
          bill.participants.forEach((participant: any) => {
            // Safely extract user information
            let userId = 'Unknown';
            let userName = 'Unknown';

            if (participant.userId) {
              if (typeof participant.userId === 'string') {
                userId = participant.userId;
                userName = 'Unknown User';
              } else if (participant.userId._id) {
                userId = participant.userId._id;
                userName = participant.userId.name || 'Unknown User';
              } else {
                userId = participant.userId;
                userName = 'Unknown User';
              }
            } else if (participant.name) {
              userName = participant.name;
              userId = participant._id || `user_${Math.random()}`;
            }

            if (!participantMap.has(userId)) {
              participantMap.set(userId, {
                userId,
                name: userName,
                totalAmount: 0,
                billCount: 0
              });
            }
            const participantData = participantMap.get(userId);
            participantData.totalAmount += participant.amount || 0;
            participantData.billCount += 1;
          });
        }
      });
      
      return {
        overview: {
          totalAmount,
          count,
          settled,
          pending
        },
        byCategory: Array.from(categoryMap.values()),
        byParticipant: Array.from(participantMap.values())
      };
    } catch (error) {
      console.error('Error fetching group stats:', error);
      // Return default stats structure to prevent crashes
      return {
        overview: {
          totalAmount: 0,
          count: 0,
          settled: 0,
          pending: 0
        },
        byCategory: [],
        byParticipant: []
      };
    }
  }
}

export default GroupExpenseService;
