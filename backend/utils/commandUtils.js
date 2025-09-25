const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const SplitBill = require('../models/SplitBill');
const Expense = require('../models/Expense');

/**
 * Parses and executes financial commands from chat messages
 * @param {string} text - Command text
 * @param {string} userId - User ID executing the command
 * @param {string} groupId - Group ID where command was executed
 * @param {Object} user - User object
 * @returns {Object} - Command execution result
 */
const parseAndExecuteCommand = async (text, userId, groupId, user) => {
  const lowerText = text.toLowerCase();

  if (lowerText.startsWith('@split')) {
    return await executeSplitCommand(text, userId, groupId, user);
  }
  else if (lowerText.startsWith('@addexpense')) {
    return await executeAddExpenseCommand(text, userId, groupId);
  }
  else if (lowerText.startsWith('@predict')) {
    return await executePredictCommand(userId);
  }
  else if (lowerText.startsWith('@summary')) {
    return await executeSummaryCommand(groupId);
  }

  return { type: 'unknown', data: {}, success: false };
};

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

  // Calculate split amount
  const totalParticipants = users.length + 1; // Include the creator
  const splitAmount = Number((amount / totalParticipants).toFixed(2));
  const roundingAdjustment = amount - (splitAmount * totalParticipants);

  // Create or get existing split bill group
  let splitGroup = await Group.findOne({
    members: {
      $all: [
        { $elemMatch: { userId: userId } },
        ...users.map(u => ({ $elemMatch: { userId: u._id } }))
      ],
      $size: totalParticipants
    }
  });

  if (!splitGroup) {
    const memberNames = [...users.map(u => u.name), user.name];
    splitGroup = new Group({
      name: `Split Bill - ${memberNames.join(', ')}`,
      description: 'Automatic group for split bills',
      createdBy: userId,
      members: [
        { userId: userId, role: 'admin', isActive: true },
        ...users.map(u => ({
          userId: u._id,
          role: 'member',
          isActive: true
        }))
      ]
    });
    await splitGroup.save();
  }

  // Create split bill with proper participant structure
  const splitBill = new SplitBill({
    description,
    totalAmount: amount,
    createdBy: userId,
    groupId: splitGroup._id,
    splitType: 'equal',
    participants: [
      // Creator always pays first to handle rounding
      {
        userId: userId,
        amount: splitAmount + roundingAdjustment,
        percentage: 100 / totalParticipants
      },
      ...users.map(u => ({
        userId: u._id,
        amount: splitAmount,
        percentage: 100 / totalParticipants
      }))
    ],
    category: 'Split',
    isSettled: false
  });

  await splitBill.save();

  // Create a corresponding expense for the group
  const groupExpense = new Expense({
    description,
    amount,
    category: 'Split',
    userId: userId,
    groupId: splitGroup._id,
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
        amount: p._id.toString() === userId.toString() ?
          (isNaN(splitAmount + roundingAdjustment) ? '0.00' : (splitAmount + roundingAdjustment).toFixed(2)) :
          (isNaN(splitAmount) ? '0.00' : splitAmount.toFixed(2))
      })),
      groupId: splitGroup._id,
      groupName: splitGroup.name,
      isNewGroup: splitGroup.createdAt === splitGroup.updatedAt,
      expenseId: groupExpense._id
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
  parseAndExecuteCommand,
  executeSplitCommand,
  executeAddExpenseCommand,
  executePredictCommand,
  executeSummaryCommand
};