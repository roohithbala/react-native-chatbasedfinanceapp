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
  if (mentions.length <= 1) { // Only @split command, no @user mentions
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    // Get all active group members except the creator
    participants = group.members
      .filter(m => m.isActive && m.userId.toString() !== userId.toString())
      .map(m => m.userId);
    
    console.log('📋 Group split - participants from group:', participants.map(p => p.toString()));
  } else {
    // For mentioned participants, get their user IDs
    // Remove the @split command from mentions if present
    const userMentions = mentions.filter(mention => mention.toLowerCase() !== '@split');
    const usernames = userMentions.map(p => p.replace('@', ''));
    const users = await User.find({ username: { $in: usernames } });
    if (users.length !== usernames.length) {
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

  // Get participant details for split bill creation
  const participantUsers = await User.find({ _id: { $in: participants } })
    .select('_id username name');

  if (participantUsers.length !== participants.length) {
    throw new Error('Some participants could not be found');
  }

  console.log('📋 Participant users found:', participantUsers.map(u => ({ id: u._id.toString(), name: u.name })));

  // Include the creator as a participant - when you split with someone, everyone pays their share
  const creatorUser = await User.findById(userId).select('_id username name');
  
  // Combine creator and other participants, ensuring no duplicates
  const allParticipantsSet = new Set([creatorUser._id.toString()]);
  const allSplitParticipants = [creatorUser];
  
  participantUsers.forEach(user => {
    if (!allParticipantsSet.has(user._id.toString())) {
      allParticipantsSet.add(user._id.toString());
      allSplitParticipants.push(user);
    }
  });

  // Calculate split amount for all participants (including creator) - everyone pays equally
  const totalParticipants = allSplitParticipants.length;
  const splitAmount = amount / totalParticipants; // Amount each participant owes
  
  // Use precise calculation to ensure sum equals total amount
  // Calculate base amount per participant
  const baseAmount = Math.floor((amount * 100) / totalParticipants) / 100;
  const totalBaseAmount = baseAmount * totalParticipants;
  const remainder = Math.round((amount - totalBaseAmount) * 100); // Convert remainder to cents
  
  // Create participant data with precise amounts that sum to total
  const participantsData = allSplitParticipants.map((u, index) => {
    let participantAmount = baseAmount;
    // Distribute remainder cents to first participants
    if (index < remainder) {
      participantAmount += 0.01;
    }
    return {
      userId: u._id,
      amount: Number(participantAmount.toFixed(2)) // Ensure exactly 2 decimal places
    };
  });

  console.log('🔄 Precise split calculation:', {
    amount,
    totalParticipants,
    baseAmount,
    totalBaseAmount,
    remainder,
    participantsData: participantsData.map(p => ({ userId: p.userId.toString(), amount: p.amount })),
    totalFromParticipants: participantsData.reduce((sum, p) => sum + p.amount, 0)
  });

  // Prepare split bill data for the controller
  const splitBillData = {
    description,
    totalAmount: amount,
    groupId: groupId, // Use the provided groupId
    participants: participantsData,
    splitType: 'equal',
    category: 'Split',
    currency: 'INR'
  };

  console.log('📋 Split bill data for controller:', {
    description: splitBillData.description,
    totalAmount: splitBillData.totalAmount,
    participantsCount: splitBillData.participants.length,
    participants: splitBillData.participants.map(p => ({
      userId: p.userId.toString(),
      amount: p.amount
    }))
  });

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

  // Get participant details for the response (including creator)
  const allParticipantIds = [userId, ...participants];
  const participantDetails = await User.find({
    _id: { $in: allParticipantIds }
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
      splitAmount: splitAmount, // This is the amount each participant owes (including creator)
      participants: participantDetails.map(p => ({
        username: p.username || 'unknown',
        name: p.name || 'Unknown',
        amount: isNaN(splitAmount) ? '0.00' : splitAmount.toFixed(2) // Everyone owes the same amount
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