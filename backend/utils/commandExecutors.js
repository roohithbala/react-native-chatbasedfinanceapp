const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const SplitBill = require('../models/SplitBill');
const Expense = require('../models/Expense');
const splitBillManagementController = require('../controllers/splitBillManagementController');

/**
 * Executes the @split command
 * @param {string} text - Command text
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @param {Object} user - User object
 * @returns {Object} - Command result
 */
const executeSplitCommand = async (text, userId, groupId, user) => {
  const parts = text.split(' ');
  const description = parts.slice(1).join(' ').split('₹')[0].trim() || 'Split Bill';

  // Extract amount - support multiple currency formats and plain numbers
  const amountMatch = text.match(/(?:[\$₹£€¥]\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[\$₹£€¥])?/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  const mentions = text.match(/@\w+/g) || [];

  // If no participants are mentioned, split with all group members
  let participants;
  if (mentions.length <= 1) { // Only @split command
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    participants = group.members
      .filter(m => m.isActive && m.userId.toString() !== userId.toString())
      .map(m => m.userId);
  } else {
    // For mentioned participants, get their user IDs
    const usernames = mentions.slice(1).map(p => p.replace('@', ''));
    const users = await User.find({ username: { $in: usernames } });
    if (users.length !== mentions.length - 1) {
      throw new Error('One or more mentioned users not found');
    }
    participants = users.map(u => u._id);
  }

  if (amount <= 0) {
    throw new Error('Invalid amount for split bill');
  }

  if (participants.length === 0) {
    throw new Error('No participants mentioned for split bill');
  }

  // Get participant user IDs
  const usernames = participants.map(p => p.replace('@', ''));
  const users = await User.find({ username: { $in: usernames } })
    .select('_id username name');

  if (users.length !== participants.length) {
    const foundUsernames = users.map(u => u.username);
    const missingUsers = usernames.filter(u => !foundUsernames.includes(u));
    throw new Error(`User(s) not found: ${missingUsers.join(', ')}`);
  }

  // Calculate split amount for participants (excluding creator who paid)
  const totalParticipants = users.length; // Only the mentioned users, not including creator
  const splitAmount = totalParticipants > 0 ? Number((amount / totalParticipants).toFixed(2)) : 0;

  // Prepare split bill data for the controller
  const splitBillData = {
    description,
    totalAmount: amount,
    groupId: groupId, // Use the provided groupId
    participants: users.map(u => ({
      userId: u._id,
      amount: splitAmount,
    })),
    splitType: 'equal',
    category: 'Split',
    currency: 'INR'
  };

  // Use the split bill management controller to create the split bill
  const splitBill = await splitBillManagementController.createSplitBill(userId, splitBillData);

  // Create a corresponding expense for the group
  const groupExpense = new Expense({
    description,
    amount,
    category: 'Split',
    userId: userId,
    groupId: groupId,
    tags: ['split-bill'],
    isRecurring: false,
  });
  await groupExpense.save();

  // Get participant details for the response
  const participantDetails = await User.find({
    _id: { $in: [...participants, userId] }
  }).select('username name');

  const participantMap = participantDetails.reduce((acc, p) => {
    acc[p._id.toString()] = p;
    return acc;
  }, {});

  return {
    type: 'split',
    data: {
      description,
      amount,
      splitAmount: splitAmount,
      participants: participantDetails.map(p => ({
        username: p.username || 'unknown',
        name: p.name || 'Unknown',
        amount: (isNaN(splitAmount) ? '0.00' : splitAmount.toFixed(2))
      })),
      groupId: groupId,
      groupName: 'Current Group', // We don't need to create a separate group for command-based splits
      isNewGroup: false,
      expenseId: groupExpense._id,
      splitBillId: splitBill._id
    },
    success: true
  };
};

/**
 * Executes the @addexpense command
 * @param {string} text - Command text
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Object} - Command result
 */
const executeAddExpenseCommand = async (text, userId, groupId) => {
  const parts = text.split(' ');
  const description = parts[1] || 'Expense';

  // Extract amount - support multiple currency formats and plain numbers
  const amountMatch = text.match(/(?:[\$₹£€¥]\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[\$₹£€¥])?/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  const categoryMatch = text.match(/#(\w+)/);
  const category = categoryMatch ? categoryMatch[1] : 'Other';

  if (amount <= 0) {
    throw new Error('Invalid amount for expense');
  }

  // Create expense
  const expense = new Expense({
    description,
    amount,
    category,
    userId,
    groupId
  });

  await expense.save();

  return {
    type: 'expense',
    data: { description, amount, category },
    success: true
  };
};

/**
 * Executes the @predict command
 * @param {string} userId - User ID
 * @returns {Object} - Command result
 */
const executePredictCommand = async (userId) => {
  // Get user's spending history
  const expenses = await Expense.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30);

  const total = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const average = expenses.length > 0 ? total / expenses.length : 0;
  const averageFormatted = isNaN(average) ? '0.00' : average.toFixed(2);

  return {
    type: 'predict',
    data: {
      prediction: `Based on your last ${expenses.length} expenses, you spend an average of ₹${averageFormatted} per transaction.`
    },
    success: true
  };
};

/**
 * Executes the @summary command
 * @param {string} groupId - Group ID
 * @returns {Object} - Command result
 */
const executeSummaryCommand = async (groupId) => {
  // Get group expenses and split bills
  const [groupExpenses, splitBills] = await Promise.all([
    Expense.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name'),
    SplitBill.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'name')
      .populate('participants.userId', 'name')
  ]);

  const summary = {
    expenses: groupExpenses.map(exp => ({
      description: exp.description || 'Unknown expense',
      amount: Number(exp.amount) || 0,
      by: exp.userId?.name || 'Unknown user',
      date: exp.createdAt,
      type: 'expense',
      category: exp.category || 'Other'
    })),
    splitBills: splitBills.map(split => ({
      description: split.description || 'Unknown split bill',
      amount: Number(split.totalAmount) || 0,
      by: split.createdBy?.name || 'Unknown user',
      date: split.createdAt,
      type: 'split',
      participants: (split.participants || []).map(p => ({
        name: p.userId?.name || 'Unknown user',
        amount: Number(p.amount) || 0,
        isPaid: Boolean(p.isPaid)
      }))
    }))
  };

  // Combine and sort by date
  const allTransactions = [...summary.expenses, ...summary.splitBills]
    .sort((a, b) => b.date - a.date)
    .slice(0, 10);

  // Calculate totals safely
  const expenseTotal = summary.expenses.reduce((sum, exp) => {
    const amount = Number(exp.amount) || 0;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const splitBillTotal = summary.splitBills.reduce((sum, split) => {
    const amount = Number(split.amount) || 0;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const total = expenseTotal + splitBillTotal;

  return {
    type: 'summary',
    data: {
      transactions: allTransactions,
      totals: {
        expenses: expenseTotal,
        splitBills: splitBillTotal,
        total: total
      }
    },
    success: true
  };
};

module.exports = {
  executeSplitCommand,
  executeAddExpenseCommand,
  executePredictCommand,
  executeSummaryCommand
};