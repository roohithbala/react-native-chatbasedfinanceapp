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
  const description = parts.slice(1).join(' ').split('₹')[0].split('#')[0].trim() || 'Split Bill';

  // Extract amount - support multiple currency formats and plain numbers
  const amountMatch = text.match(/(?:[\$₹£€¥]\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[\$₹£€¥])?/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  
  // Extract category from hashtag (e.g., #food, #transport)
  const categoryMatch = text.match(/#(\w+)/);
  const rawCategory = categoryMatch ? categoryMatch[1] : 'Other';
  
  // Validate and map category to enum values
  const validCategories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
  const category = validCategories.find(c => c.toLowerCase() === rawCategory.toLowerCase()) || 'Other';
  
  const mentions = text.match(/@\w+/g) || [];

  // If no participants are mentioned or @all is used, split with all group members
  let participants;
  const hasAllMention = mentions.some(m => m.toLowerCase() === '@all');
  
  if (mentions.length <= 1 || hasAllMention) { // Only @split command, no @user mentions, or @all mentioned
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    // Get all active group members except the creator
    // Ensure userId is properly extracted as ObjectId
    participants = group.members
      .filter(m => {
        if (!m.userId) return false;
        if (m.isActive === false) return false;
        const memberIdString = m.userId.toString();
        const creatorIdString = userId.toString();
        return memberIdString !== creatorIdString;
      })
      .map(m => {
        // Handle both populated and unpopulated userId
        return m.userId._id || m.userId;
      });
    
    console.log('📋 Group split - participants from group:', participants.map(p => p.toString()));
  } else {
    // For mentioned participants, get their user IDs
    // Remove the @split command from mentions if present
    const userMentions = mentions.filter(mention => mention.toLowerCase() !== '@split' && mention.toLowerCase() !== '@all');
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
    
    // Ensure userId is a string for consistency
    const userIdString = u._id.toString();
    
    return {
      userId: userIdString, // Convert ObjectId to string
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
    category: category, // Use extracted and validated category
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
    category: category, // Use extracted and validated category
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
  
  // Check if --split flag is present
  const shouldSplit = text.includes('--split') || text.includes('-s');

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

  // If --split flag is present and in a group, create a split bill
  let splitBill = null;
  if (shouldSplit && groupId) {
    try {
      // Get group members
      const group = await Group.findById(groupId).populate('members.userId', 'name username');
      
      if (group && group.members) {
        // Get active members excluding the creator
        const activeMembers = group.members
          .filter(m => m.isActive && m.userId && m.userId._id.toString() !== userId.toString())
          .map(m => m.userId);

        if (activeMembers.length > 0) {
          // Calculate split amount
          const totalParticipants = activeMembers.length + 1; // Include creator
          const splitAmount = amount / totalParticipants;

          // Create participants array
          const participants = activeMembers.map(member => ({
            userId: member._id,
            amount: splitAmount,
            isPaid: false,
            isRejected: false
          }));

          // Add creator as participant who already paid
          participants.push({
            userId: userId,
            amount: splitAmount,
            isPaid: true,
            isRejected: false,
            paidAt: new Date()
          });

          // Create split bill
          splitBill = new SplitBill({
            description: `${description} (split expense)`,
            totalAmount: amount,
            splitType: 'equal',
            category: category,
            createdBy: userId,
            groupId: groupId,
            participants: participants,
            isSettled: false
          });

          await splitBill.save();
          
          // Populate for return
          await splitBill.populate('createdBy', 'name username avatar');
          await splitBill.populate('participants.userId', 'name username avatar');

          console.log('✅ Created split bill from @addexpense --split:', {
            splitBillId: splitBill._id,
            description: splitBill.description,
            amount: splitBill.totalAmount,
            participants: splitBill.participants.length
          });
        }
      }
    } catch (error) {
      console.error('Error creating split bill from expense:', error);
      // Don't throw - expense was still created successfully
    }
  }

  return {
    type: 'expense',
    data: { description, amount, category, splitBill },
    success: true
  };
};

/**
 * Executes the @predict command using Gemini AI
 * @param {string} userId - User ID
 * @returns {Object} - Command result
 */
const executePredictCommand = async (userId) => {
  try {
    // Get user's spending history
    const expenses = await Expense.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    if (expenses.length === 0) {
      return {
        type: 'predict',
        data: {
          prediction: `You don't have enough expense data yet. Start tracking your expenses to get AI-powered predictions!`
        },
        success: true
      };
    }

    const total = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const average = expenses.length > 0 ? total / expenses.length : 0;

    // Prepare expense data for AI analysis
    const categoryBreakdown = {};
    expenses.forEach(exp => {
      const category = exp.category || 'Other';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { total: 0, count: 0 };
      }
      categoryBreakdown[category].total += Number(exp.amount) || 0;
      categoryBreakdown[category].count += 1;
    });

    // Create AI prompt with expense data
    const prompt = `As a financial advisor, analyze this spending data and provide a brief prediction (2-3 sentences) about future spending patterns:

Total expenses tracked: ${expenses.length}
Total amount spent: ₹${total.toFixed(2)}
Average per expense: ₹${average.toFixed(2)}

Category breakdown:
${Object.entries(categoryBreakdown).map(([cat, data]) => 
  `- ${cat}: ₹${data.total.toFixed(2)} (${data.count} transactions)`
).join('\n')}

Recent expenses (last 5):
${expenses.slice(0, 5).map(exp => 
  `- ${exp.description || 'Unknown'}: ₹${(Number(exp.amount) || 0).toFixed(2)} (${exp.category || 'Other'})`
).join('\n')}

Provide actionable insights and spending predictions.`;

    // Initialize Gemini AI
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('AIzaSyCYCPiREIu2ue3ydCCLLAKrWtoS1DyjThc');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Generate AI prediction
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const prediction = response.text();

    return {
      type: 'predict',
      data: {
        prediction: prediction.trim()
      },
      success: true
    };
  } catch (error) {
    console.error('Error in executePredictCommand:', error);
    
    // Fallback to basic prediction if AI fails
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
  }
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