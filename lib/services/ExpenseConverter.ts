import { SplitBill } from './splitBillService';
import { GroupExpense, GroupExpenseParticipant } from '@/app/types/groupExpense';

export class ExpenseConverter {
  // Convert split bill to group expense
  static splitBillToGroupExpense(splitBill: SplitBill): GroupExpense {
    return {
      _id: splitBill._id,
      description: splitBill.description,
      amount: splitBill.totalAmount,
      category: splitBill.category,
      groupId: splitBill.groupId, // Now optional
      paidBy: splitBill.createdBy._id,
      participants: splitBill.participants.map((p: any) => ({
        userId: p.userId && typeof p.userId === 'object' && p.userId._id ? p.userId._id : p.userId,
        amount: p.amount,
        isPaid: p.isPaid,
        paidAt: p.paidAt
      })),
      currency: splitBill.currency,
      createdAt: splitBill.createdAt instanceof Date ? splitBill.createdAt : new Date(splitBill.createdAt),
      updatedAt: splitBill.updatedAt instanceof Date ? splitBill.updatedAt : new Date(splitBill.updatedAt)
    };
  }

  // Convert group expense to split bill format
  static groupExpenseToSplitBill(expense: GroupExpense): Partial<SplitBill> {
    return {
      _id: expense._id,
      description: expense.description,
      totalAmount: expense.amount,
      category: expense.category,
      groupId: expense.groupId,
      participants: expense.participants.map(p => ({
        userId: p.userId, // Keep as string for now, will be converted when needed
        amount: p.amount,
        isPaid: p.isPaid,
        paidAt: p.paidAt
      })) as any, // Type assertion needed due to interface mismatch
      currency: expense.currency,
      createdAt: expense.createdAt instanceof Date ? expense.createdAt : new Date(expense.createdAt),
      updatedAt: expense.updatedAt instanceof Date ? expense.updatedAt : new Date(expense.updatedAt)
    };
  }

  // Merge expense data with split bill data
  static mergeExpenseWithSplitBill(expense: GroupExpense, splitBill: SplitBill): GroupExpense {
    return {
      ...expense,
      participants: splitBill.participants.map((p: any) => ({
        userId: p.userId && typeof p.userId === 'object' && p.userId._id ? p.userId._id : p.userId,
        amount: p.amount,
        isPaid: p.isPaid,
        paidAt: p.paidAt
      })),
      updatedAt: splitBill.updatedAt instanceof Date ? splitBill.updatedAt : new Date(splitBill.updatedAt)
    };
  }

  // Validate expense data
  static validateExpenseData(expenseData: Partial<GroupExpense>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!expenseData.description?.trim()) {
      errors.push('Description is required');
    }

    if (!expenseData.amount || expenseData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!expenseData.currency) {
      errors.push('Currency is required');
    }

    if (!expenseData.participants || expenseData.participants.length === 0) {
      errors.push('At least one participant is required');
    } else {
      // Validate participants
      expenseData.participants.forEach((participant, index) => {
        if (!participant.userId) {
          errors.push(`Participant ${index + 1}: User ID is required`);
        }
        if (!participant.amount || participant.amount <= 0) {
          errors.push(`Participant ${index + 1}: Amount must be greater than 0`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculate total amount from participants
  static calculateTotalFromParticipants(participants: GroupExpenseParticipant[]): number {
    return participants.reduce((total, participant) => total + (participant.amount || 0), 0);
  }

  // Normalize participant amounts (ensure they add up to total)
  static normalizeParticipantAmounts(participants: GroupExpenseParticipant[], totalAmount: number): GroupExpenseParticipant[] {
    const currentTotal = this.calculateTotalFromParticipants(participants);

    if (currentTotal === 0) {
      // If no amounts specified, split equally
      const equalAmount = totalAmount / participants.length;
      return participants.map(p => ({ ...p, amount: equalAmount }));
    }

    if (Math.abs(currentTotal - totalAmount) < 0.01) {
      // Already normalized
      return participants;
    }

    // Scale amounts to match total
    const scaleFactor = totalAmount / currentTotal;
    return participants.map(p => ({
      ...p,
      amount: Math.round((p.amount * scaleFactor) * 100) / 100 // Round to 2 decimal places
    }));
  }
}