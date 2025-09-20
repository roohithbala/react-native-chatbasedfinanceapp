const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

console.log('Expense model loaded:', !!Expense);
console.log('Expense model name:', Expense?.modelName);
console.log('Expense model collection name:', Expense?.collection?.name);
console.log('Mongoose connection ready state:', mongoose.connection.readyState);

// Test if we can access the Expense model
try {
  console.log('Expense model schema paths:', Expense?.schema?.paths ? Object.keys(Expense.schema.paths) : 'No schema paths');
} catch (error) {
  console.error('Error accessing Expense schema:', error);
}

const router = express.Router();

// Get user expenses
router.get('/', auth, async (req, res) => {
  try {
    console.log('Expenses API called by user:', req.userId);
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);
    console.log('Auth middleware result - req.user:', req.user);
    console.log('Auth middleware result - req.userId:', req.userId);
    
    if (!req.userId) {
      console.log('No userId found in request');
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    
    const query = { userId: req.userId };
    console.log('Base query:', query);
    console.log('req.userId type:', typeof req.userId);
    console.log('req.userId value:', req.userId);
    
    // Try to convert userId to ObjectId if it's a string
    if (typeof req.userId === 'string' && req.userId.match(/^[0-9a-fA-F]{24}$/)) {
      query.userId = new mongoose.Types.ObjectId(req.userId);
      console.log('Converted userId to ObjectId:', query.userId);
    }
    
    if (category) query.category = category;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    console.log('Final MongoDB query:', query);

    // Check if Expense model is properly loaded
    console.log('Expense model exists:', !!Expense);
    console.log('Expense model name:', Expense?.modelName);
    console.log('Expense collection name:', Expense?.collection?.name);

    // First, let's count documents to see if the query works
    let total = 0;
    try {
      total = await Expense.countDocuments(query);
      console.log('Total documents found:', total);
    } catch (countError) {
      console.error('Error in countDocuments:', countError);
      total = 0;
    }

    let expenses = [];
    try {
      const expensesResult = await Expense.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'name avatar');
      
      console.log('Raw expenses result:', expensesResult);
      console.log('Expenses result type:', typeof expensesResult);
      console.log('Expenses result is array:', Array.isArray(expensesResult));
      
      // Ensure we have an array
      expenses = Array.isArray(expensesResult) ? expensesResult : [];
    } catch (findError) {
      console.error('Error in Expense.find():', findError);
      expenses = []; // Ensure expenses is always an array
    }

    console.log(`Found ${expenses.length} expenses out of ${total} total`);
    console.log('Sample expense:', expenses[0] ? {
      _id: expenses[0]._id,
      description: expenses[0].description,
      amount: expenses[0].amount,
      userId: expenses[0].userId
    } : 'No expenses found');

    const response = {
      status: 'success',
      data: {
        expenses: expenses,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      },
      message: 'Expenses retrieved successfully'
    };

    console.log('Sending response:', {
      expensesCount: response.data.expenses.length,
      totalPages: response.data.totalPages,
      currentPage: response.data.currentPage,
      total: response.data.total,
      status: response.status
    });

    res.json(response);
  } catch (error) {
    console.error('Get expenses error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add expense
router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, category, groupId, tags, location } = req.body;

    // Validation
    if (!description || !amount) {
      return res.status(400).json({ message: 'Description and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    // Validate groupId if provided
    let validGroupId = null;
    if (groupId) {
      try {
        // Check if groupId is a valid ObjectId format
        if (groupId.match(/^[0-9a-fA-F]{24}$/)) {
          const Group = require('../models/Group');
          const group = await Group.findOne({
            _id: groupId,
            'members.userId': req.userId,
            isActive: true
          });
          if (group) {
            validGroupId = groupId;
          }
        }
      } catch (error) {
        console.log('Invalid groupId provided:', groupId);
        // Continue without groupId if invalid
      }
    }

    const expense = new Expense({
      description,
      amount,
      category: category || 'Other',
      userId: req.userId,
      groupId: validGroupId,
      tags,
      location
    });

    await expense.save();
    await expense.populate('userId', 'name avatar');

    res.status(201).json({
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const { description, amount, category, tags, location } = req.body;
    
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (tags) expense.tags = tags;
    if (location) expense.location = location;

    await expense.save();
    await expense.populate('userId', 'name avatar');

    res.json({
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const stats = await Expense.aggregate([
      {
        $match: {
          userId: req.userId,
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

    res.json({
      stats,
      totalSpent,
      period
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;