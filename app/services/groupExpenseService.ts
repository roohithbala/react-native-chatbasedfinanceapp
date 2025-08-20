import { SplitBill } from '@/app/services/splitBillService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  GroupExpense, 
  GroupExpenseParticipant,
  GroupExpenseStats
} from '@/app/types/groupExpense';

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
      groupId: splitBill.groupId,
      paidBy: splitBill.createdBy._id,
      participants: splitBill.participants.map(p => ({
        userId: p.userId._id,
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
    const expenses = await fetch(`/api/groups/${groupId}/expenses`).then(res => res.json());
    const splitBills = await fetch(`/api/split-bills/group/${groupId}`).then(res => res.json());
    
    return expenses.map((expense: GroupExpense) => {
      const relatedSplitBills = splitBills.filter(
        (bill: SplitBill) => bill._id === expense._id
      );
      return {
        ...expense,
        splitBills: relatedSplitBills
      };
    });
  }

  // Get expense details with split bill info
  static async getExpenseDetails(groupId: string, expenseId: string): Promise<GroupExpenseWithSplitBills> {
    const expense = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`).then(res => res.json());
    const splitBill = await fetch(`/api/split-bills/${expenseId}`).then(res => res.json());
    
    return {
      ...expense,
      splitBills: splitBill ? [splitBill] : []
    };
  }

  // Create a new group expense and optionally create split bill
  static async createGroupExpense(
    groupId: string, 
    expenseData: Omit<GroupExpense, '_id'>,
    createSplitBill: boolean = false
  ): Promise<GroupExpenseWithSplitBills> {
    // First create the expense
    const expense = await fetch(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    }).then(res => res.json());

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
        currency: expenseData.currency || 'USD'
      };

      const splitBill = await fetch('/api/split-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(splitBillData)
      }).then(res => res.json());

      return {
        ...expense,
        splitBills: [splitBill]
      };
    }

    return {
      ...expense,
      splitBills: []
    };
  }

  // Update group expense and related split bill
  static async updateGroupExpense(
    groupId: string,
    expenseId: string,
    updates: Partial<GroupExpense>
  ): Promise<GroupExpenseWithSplitBills> {
    // Update the expense
    const expense = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => res.json());

    // Check if there's a related split bill and update it
    const splitBill = await fetch(`/api/split-bills/${expenseId}`).then(res => res.json());
    
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

      const updatedSplitBill = await fetch(`/api/split-bills/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(splitBillUpdates)
      }).then(res => res.json());

      return {
        ...expense,
        splitBills: [updatedSplitBill]
      };
    }

    return {
      ...expense,
      splitBills: []
    };
  }

  // Mark an expense as paid by a participant
  static async markAsPaid(
    groupId: string, 
    expenseId: string, 
    userId: string
  ): Promise<GroupExpenseWithSplitBills> {
    // Mark the expense as paid
    const expense = await fetch(`/api/groups/${groupId}/expenses/${expenseId}/mark-paid`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).then(res => res.json());

    // Also mark the split bill as paid if it exists
    try {
      const splitBill = await fetch(`/api/split-bills/${expenseId}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json());

      return {
        ...expense,
        splitBills: [splitBill]
      };
    } catch {
      // If there's no split bill, return just the expense
      return {
        ...expense,
        splitBills: []
      };
    }
  }

  // Get expense statistics for a group
  static async getGroupExpenseStats(
    groupId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ) {
    try {
      // Import the api instance to use the proper base URL
      const { default: api } = await import('./api');
      
      // Try to get group stats from the backend endpoint
      try {
        const statsResponse = await api.get(`/groups/${groupId}/stats`);
        if (statsResponse.data && statsResponse.data.status === 'success') {
          return statsResponse.data.data;
        }
      } catch (error) {
        console.log('Group stats endpoint not available, using fallback method');
      }
      
      // Fallback: Try to get group data and split bills separately
      const groupResponse = await api.get(`/groups/${groupId}`);
      const groupData = groupResponse.data;
      
      // Try to get split bills for the group
      let splitBills = [];
      try {
        const splitBillResponse = await api.get(`/split-bills`, {
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
            const userId = participant.userId?._id || participant.userId;
            const userName = participant.userId?.name || participant.name || 'Unknown';
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
