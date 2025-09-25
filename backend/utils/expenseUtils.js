const mongoose = require('mongoose');

// Validate expense data
const validateExpenseData = (data) => {
  const { description, amount } = data;
  const errors = [];

  if (!description || !description.trim()) {
    errors.push('Description is required');
  }

  if (!amount || amount <= 0) {
    errors.push('Amount must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Build expense query
const buildExpenseQuery = (userId, filters = {}) => {
  const { category, startDate, endDate, groupId } = filters;
  const query = { userId };

  if (category) query.category = category;
  if (groupId) query.groupId = groupId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return query;
};

// Validate and get group for expense
const validateExpenseGroup = async (groupId, userId) => {
  if (!groupId) return null;

  try {
    if (!groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return null;
    }

    const Group = require('../models/Group');
    const group = await Group.findOne({
      _id: groupId,
      'members.userId': userId,
      isActive: true
    });

    return group ? groupId : null;
  } catch (error) {
    console.log('Invalid groupId provided:', groupId);
    return null;
  }
};

// Calculate expense statistics
const calculateExpenseStats = async (userId, period = 'month') => {
  let startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const Expense = require('../models/Expense');
  const stats = await Expense.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);

  const totalSpent = stats.reduce((sum, stat) => sum + stat.total, 0);

  return {
    stats,
    totalSpent,
    period
  };
};

module.exports = {
  validateExpenseData,
  buildExpenseQuery,
  validateExpenseGroup,
  calculateExpenseStats
};