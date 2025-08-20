const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user expenses
router.get('/', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    
    const query = { userId: req.userId };
    
    if (category) query.category = category;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name avatar');

    const total = await Expense.countDocuments(query);

    res.json({
      expenses: expenses || [],
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
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