const Expense = require('../models/Expense');
const {
  validateExpenseData,
  buildExpenseQuery,
  validateExpenseGroup,
  calculateExpenseStats
} = require('../utils/expenseUtils');
const { sendNewExpenseEmail } = require('../utils/emailService');

// Get user expenses
const getUserExpenses = async (userId, queryParams) => {
  const { page = 1, limit = 20, category, startDate, endDate, groupId } = queryParams;

  const query = buildExpenseQuery(userId, { category, startDate, endDate, groupId });

  // Convert userId to ObjectId if needed
  if (typeof query.userId === 'string' && query.userId.match(/^[0-9a-fA-F]{24}$/)) {
    query.userId = new (require('mongoose')).Types.ObjectId(query.userId);
  }

  const total = await Expense.countDocuments(query);

  const expenses = await Expense.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('userId', 'name avatar');

  return {
    expenses: Array.isArray(expenses) ? expenses : [],
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total
  };
};

// Create expense
const createExpense = async (userId, expenseData, io) => {
  const { description, amount, category, groupId, tags } = expenseData;

  // Validate expense data
  const validation = validateExpenseData({ description, amount });
  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  // Validate group if provided
  const validGroupId = await validateExpenseGroup(groupId, userId);

  const expense = new Expense({
    description: description.trim(),
    amount,
    category: category || 'Other',
    userId,
    groupId: validGroupId,
    tags
  });

  await expense.save();
  await expense.populate('userId', 'name avatar');

  // Emit real-time update
  if (io) {
    io.to(`user-${userId}`).emit('expense-update', {
      type: 'created',
      expense: expense
    });

    // If it's a group expense, also emit to group room
    if (validGroupId) {
      io.to(validGroupId).emit('expense-update', {
        type: 'created',
        expense: expense,
        groupId: validGroupId
      });
    }
  }

  // Send email notifications to group members (fire-and-forget)
  if (validGroupId) {
    try {
      const Group = require('../models/Group');
      const group = await Group.findById(validGroupId).populate('members.userId', 'name email');
      const creatorName = expense.userId?.name || expense.userId?.username || 'Someone';
      const sendPromises = (group.members || []).map(async (m) => {
        try {
          const userObj = m.userId;
          if (userObj && userObj.email && userObj._id.toString() !== userId.toString()) {
            await sendNewExpenseEmail(userObj.email, userObj.name || userObj.username, expense, group, creatorName);
          }
        } catch (e) {
          console.error('Failed to send new expense email to member:', e.message || e);
        }
      });

      Promise.allSettled(sendPromises).then(results => {
        console.log('New expense notification results:', results.map(r => ({status: r.status})).slice(0,5));
      });
    } catch (notifyErr) {
      console.error('Error while sending new expense notifications:', notifyErr);
    }
  }

  return expense;
};

// Update expense
const updateExpense = async (expenseId, userId, updateData, io) => {
  const { description, amount, category, tags } = updateData;

  const expense = await Expense.findOne({ _id: expenseId, userId });
  if (!expense) {
    throw new Error('Expense not found');
  }

  // Update fields if provided
  if (description) expense.description = description;
  if (amount) expense.amount = amount;
  if (category) expense.category = category;
  if (tags) expense.tags = tags;

  await expense.save();
  await expense.populate('userId', 'name avatar');

  // Emit real-time update
  if (io) {
    io.to(`user-${userId}`).emit('expense-update', {
      type: 'updated',
      expense: expense
    });

    // If it's a group expense, also emit to group room
    if (expense.groupId) {
      io.to(expense.groupId.toString()).emit('expense-update', {
        type: 'updated',
        expense: expense,
        groupId: expense.groupId.toString()
      });
    }
  }

  return expense;
};

// Delete expense
const deleteExpense = async (expenseId, userId, io) => {
  const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });
  if (!expense) {
    throw new Error('Expense not found');
  }

  // Emit real-time update
  if (io) {
    io.to(`user-${userId}`).emit('expense-update', {
      type: 'deleted',
      expenseId: expenseId
    });

    // If it was a group expense, also emit to group room
    if (expense.groupId) {
      io.to(expense.groupId.toString()).emit('expense-update', {
        type: 'deleted',
        expenseId: expenseId,
        groupId: expense.groupId.toString()
      });
    }
  }

  return expense;
};

// Get expense statistics
const getExpenseStats = async (userId, period = 'month') => {
  return await calculateExpenseStats(userId, period);
};

// Reset all user expenses
const resetUserExpenses = async (userId, io) => {
  // Archive all expenses for the user instead of deleting
  const result = await Expense.updateMany(
    { userId, archived: false }, // Only archive non-archived expenses
    { $set: { archived: true } }
  );

  // Emit real-time update to notify clients
  if (io) {
    io.to(`user-${userId}`).emit('expense-update', {
      type: 'reset',
      userId: userId
    });
  }

  return {
    archivedCount: result.modifiedCount,
    message: `Successfully archived ${result.modifiedCount} expenses`
  };
};

module.exports = {
  getUserExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  resetUserExpenses
};