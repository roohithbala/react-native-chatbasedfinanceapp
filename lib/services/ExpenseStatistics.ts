import { SplitBill } from './splitBillService';
import { GroupExpense } from '@/app/types/groupExpense';
import { default as api } from './api';
import type { AxiosInstance } from 'axios';

// Type assertion to ensure api is treated as AxiosInstance
const typedApi: AxiosInstance = api as any;

export interface ExpenseStats {
  overview: {
    totalAmount: number;
    count: number;
    settled: number;
    pending: number;
  };
  byCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  byParticipant: Array<{
    userId: string;
    name: string;
    totalAmount: number;
    billCount: number;
  }>;
}

export class ExpenseStatistics {
  // Get expense statistics for a group
  static async getGroupExpenseStats(
    groupId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<ExpenseStats> {
    try {
      // Validate groupId
      if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
        throw new Error('Invalid group ID provided');
      }

      // Try to get group stats from the backend endpoint
      try {
        const statsResponse = await typedApi.get(`/groups/${groupId}/stats`);
        if (statsResponse.data && statsResponse.data.status === 'success') {
          return statsResponse.data.data;
        }
      } catch (error: any) {
        console.log('Group stats endpoint not available, using fallback method. Error:', error.response?.status);
      }

      // Fallback: Calculate stats from available data
      const stats = await this.calculateStatsFromData(groupId);
      return stats;
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

  // Calculate statistics from raw data
  private static async calculateStatsFromData(groupId: string): Promise<ExpenseStats> {
    // Try to get split bills for the group
    let splitBills: SplitBill[] = [];
    try {
      const splitBillResponse = await typedApi.get(`/split-bills`, {
        params: { groupId, limit: 100 }
      });
      // The API returns { splitBills: [...], totalPages: ..., currentPage: ..., total: ... }
      splitBills = Array.isArray(splitBillResponse.data?.splitBills)
        ? splitBillResponse.data.splitBills
        : (splitBillResponse.data?.bills || []);
    } catch (error) {
      console.log('No split bills found for group:', error);
      splitBills = []; // Ensure splitBills is always an array
    }

    // Ensure splitBills is always an array
    if (!Array.isArray(splitBills)) {
      splitBills = [];
    }

    return this.calculateStatsFromSplitBills(splitBills);
  }

  // Calculate statistics from split bills array
  static calculateStatsFromSplitBills(splitBills: SplitBill[]): ExpenseStats {
    // Calculate overview stats
    const totalAmount = splitBills.reduce((sum: number, bill: any) => sum + (bill.totalAmount || 0), 0);
    const count = splitBills.length;
    const settled = splitBills.filter((bill: any) => bill.isSettled).length;
    const pending = count - settled;

    // Group by category
    const categoryMap = new Map<string, { category: string; amount: number; count: number }>();
    splitBills.forEach((bill: any) => {
      const category = bill.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { category, amount: 0, count: 0 });
      }
      const categoryData = categoryMap.get(category)!;
      categoryData.amount += bill.totalAmount || 0;
      categoryData.count += 1;
    });

    // Group by participant
    const participantMap = new Map<string, { userId: string; name: string; totalAmount: number; billCount: number }>();
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
          const participantData = participantMap.get(userId)!;
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
  }

  // Calculate participant balance summary
  static calculateParticipantBalances(splitBills: SplitBill[]): Array<{
    userId: string;
    name: string;
    paid: number;
    owes: number;
    balance: number;
  }> {
    const participantBalances = new Map<string, { userId: string; name: string; paid: number; owes: number }>();

    splitBills.forEach((bill: any) => {
      if (bill.participants && Array.isArray(bill.participants)) {
        bill.participants.forEach((participant: any) => {
          let userId = 'Unknown';
          let userName = 'Unknown';

          if (participant.userId) {
            if (typeof participant.userId === 'string') {
              userId = participant.userId;
              userName = 'Unknown User';
            } else if (participant.userId._id) {
              userId = participant.userId._id;
              userName = participant.userId.name || 'Unknown User';
            }
          }

          if (!participantBalances.has(userId)) {
            participantBalances.set(userId, {
              userId,
              name: userName,
              paid: 0,
              owes: participant.amount || 0
            });
          } else {
            const balance = participantBalances.get(userId)!;
            balance.owes += participant.amount || 0;
          }
        });
      }

      // Add amount paid by the creator
      if (bill.createdBy && bill.totalAmount) {
        const creatorId = typeof bill.createdBy === 'string' ? bill.createdBy : bill.createdBy._id;
        if (participantBalances.has(creatorId)) {
          const balance = participantBalances.get(creatorId)!;
          balance.paid += bill.totalAmount;
        } else {
          const creatorName = typeof bill.createdBy === 'string' ? 'Unknown' : (bill.createdBy.name || 'Unknown');
          participantBalances.set(creatorId, {
            userId: creatorId,
            name: creatorName,
            paid: bill.totalAmount,
            owes: 0
          });
        }
      }
    });

    // Calculate final balances
    return Array.from(participantBalances.values()).map(balance => ({
      ...balance,
      balance: balance.paid - balance.owes
    }));
  }

  // Get spending trends over time
  static calculateSpendingTrends(splitBills: SplitBill[], period: 'week' | 'month' | 'year' = 'month'): Array<{
    period: string;
    amount: number;
    count: number;
  }> {
    const trends = new Map<string, { amount: number; count: number }>();

    splitBills.forEach((bill: any) => {
      if (bill.createdAt) {
        const date = new Date(bill.createdAt);
        let periodKey: string;

        switch (period) {
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            periodKey = String(date.getFullYear());
            break;
          default:
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!trends.has(periodKey)) {
          trends.set(periodKey, { amount: 0, count: 0 });
        }
        const trend = trends.get(periodKey)!;
        trend.amount += bill.totalAmount || 0;
        trend.count += 1;
      }
    });

    return Array.from(trends.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}