import { SplitBill } from './splitBillService';
import { GroupExpense } from '@/app/types/groupExpense';
import { default as api } from './api';
import type { AxiosInstance } from 'axios';

// Type assertion to ensure api is treated as AxiosInstance
const typedApi: AxiosInstance = api as any;

export interface GroupExpenseWithSplitBills extends GroupExpense {
  splitBills: SplitBill[];
}

export class ExpenseQueries {
  // Get all group expenses including split bills
  static async getGroupExpenses(groupId: string): Promise<GroupExpenseWithSplitBills[]> {
    try {
      const [expensesResponse, splitBillsResponse] = await Promise.all([
        typedApi.get(`/groups/${groupId}/expenses`),
        typedApi.get(`/split-bills/group/${groupId}`)
      ]);

      const expenses = Array.isArray(expensesResponse.data?.data?.expenses)
        ? expensesResponse.data.data.expenses
        : [];
      const splitBills = Array.isArray(splitBillsResponse.data?.splitBills)
        ? splitBillsResponse.data.splitBills
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
      const [expenseResponse, splitBillResponse] = await Promise.all([
        typedApi.get(`/groups/${groupId}/expenses/${expenseId}`),
        typedApi.get(`/split-bills/${expenseId}`)
      ]);

      const expense = expenseResponse.data?.data?.expense || expenseResponse.data?.data;
      const splitBill = splitBillResponse.data?.splitBill || splitBillResponse.data?.data?.splitBill || splitBillResponse.data?.data;

      return {
        ...expense,
        splitBills: splitBill ? [splitBill] : []
      };
    } catch (error) {
      console.error('Error fetching expense details:', error);
      throw error;
    }
  }

  // Get expenses by participant
  static async getExpensesByParticipant(userId: string, groupId?: string): Promise<GroupExpenseWithSplitBills[]> {
    try {
      const params = groupId ? { groupId } : {};
      const response = await typedApi.get(`/expenses/user/${userId}`, { params });

      const expenses = Array.isArray(response.data?.data?.expenses)
        ? response.data.data.expenses
        : [];

      // Get split bills for each expense
      const expensesWithSplitBills = await Promise.all(
        expenses.map(async (expense: GroupExpense) => {
          try {
            const splitBillResponse = await typedApi.get(`/split-bills/${expense._id}`);
            const splitBill = splitBillResponse.data?.data?.splitBill || splitBillResponse.data?.data;
            return {
              ...expense,
              splitBills: splitBill ? [splitBill] : []
            };
          } catch {
            return {
              ...expense,
              splitBills: []
            };
          }
        })
      );

      return expensesWithSplitBills;
    } catch (error) {
      console.error('Error fetching expenses by participant:', error);
      return [];
    }
  }

  // Get expenses by category
  static async getExpensesByCategory(groupId: string, category: string): Promise<GroupExpenseWithSplitBills[]> {
    try {
      const response = await typedApi.get(`/groups/${groupId}/expenses`, {
        params: { category }
      });

      const expenses = Array.isArray(response.data?.data?.expenses)
        ? response.data.data.expenses
        : [];

      return expenses.map((expense: GroupExpense) => ({
        ...expense,
        splitBills: []
      }));
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      return [];
    }
  }

  // Search expenses
  static async searchExpenses(groupId: string, query: string): Promise<GroupExpenseWithSplitBills[]> {
    try {
      const response = await typedApi.get(`/groups/${groupId}/expenses/search`, {
        params: { q: query }
      });

      const expenses = Array.isArray(response.data?.data?.expenses)
        ? response.data.data.expenses
        : [];

      return expenses.map((expense: GroupExpense) => ({
        ...expense,
        splitBills: []
      }));
    } catch (error) {
      console.error('Error searching expenses:', error);
      return [];
    }
  }
}