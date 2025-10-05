import { ExpenseConverter } from './ExpenseConverter';
import { ExpenseQueries, GroupExpenseWithSplitBills } from './ExpenseQueries';
import { ExpenseStatistics, ExpenseStats } from './ExpenseStatistics';
import { ExpenseOperations } from './ExpenseOperations';

export class GroupExpenseService {
  // Data conversion utilities
  static splitBillToGroupExpense = ExpenseConverter.splitBillToGroupExpense;
  static groupExpenseToSplitBill = ExpenseConverter.groupExpenseToSplitBill;
  static mergeExpenseWithSplitBill = ExpenseConverter.mergeExpenseWithSplitBill;
  static validateExpenseData = ExpenseConverter.validateExpenseData;
  static calculateTotalFromParticipants = ExpenseConverter.calculateTotalFromParticipants;
  static normalizeParticipantAmounts = ExpenseConverter.normalizeParticipantAmounts;

  // Query operations
  static getGroupExpenses = ExpenseQueries.getGroupExpenses;
  static getExpenseDetails = ExpenseQueries.getExpenseDetails;
  static getExpensesByParticipant = ExpenseQueries.getExpensesByParticipant;
  static getExpensesByCategory = ExpenseQueries.getExpensesByCategory;
  static searchExpenses = ExpenseQueries.searchExpenses;

  // CRUD operations
  static createGroupExpense = ExpenseOperations.createGroupExpense;
  static updateGroupExpense = ExpenseOperations.updateGroupExpense;
  static markAsPaid = ExpenseOperations.markAsPaid;
  static deleteExpense = ExpenseOperations.deleteExpense;

  // Statistics and analytics
  static getGroupExpenseStats = ExpenseStatistics.getGroupExpenseStats;
  static calculateStatsFromSplitBills = ExpenseStatistics.calculateStatsFromSplitBills;
  static calculateParticipantBalances = ExpenseStatistics.calculateParticipantBalances;
  static calculateSpendingTrends = ExpenseStatistics.calculateSpendingTrends;
}

export default GroupExpenseService;
