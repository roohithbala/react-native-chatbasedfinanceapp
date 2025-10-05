import { SplitBill } from './splitBillService';
import { GroupExpense, GroupExpenseParticipant } from '@/app/types/groupExpense';
import { default as api } from './api';
import type { AxiosInstance } from 'axios';
import { ExpenseConverter } from './ExpenseConverter';

// Type assertion to ensure api is treated as AxiosInstance
const typedApi: AxiosInstance = api as any;

export interface GroupExpenseWithSplitBills extends GroupExpense {
  splitBills: SplitBill[];
}

export class ExpenseOperations {
  // Create a new group expense and optionally create split bill
  static async createGroupExpense(
    groupId: string,
    expenseData: Omit<GroupExpense, '_id'>,
    createSplitBill: boolean = false
  ): Promise<GroupExpenseWithSplitBills> {
    try {
      // Validate expense data
      const validation = ExpenseConverter.validateExpenseData(expenseData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

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

  // Delete an expense
  static async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    try {
      // Delete the expense
      await typedApi.delete(`/groups/${groupId}/expenses/${expenseId}`);

      // Try to delete related split bill
      try {
        await typedApi.delete(`/split-bills/${expenseId}`);
      } catch (splitBillError) {
        console.log('No split bill found to delete for expense:', expenseId);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}