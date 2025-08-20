const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user budgets
router.get('/', auth, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const budgets = await Budget.find({
      userId: req.userId,
      period,
      isActive: true
    }).sort({ category: 1 });

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const expenses = await Expense.find({
          userId: req.userId,
          category: budget.category,
          createdAt: {
            $gte: budget.startDate,
            $lte: budget.endDate
          }
        });

        const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        return {
          ...budget.toObject(),
          spent,
          remaining: budget.amount - spent,
          percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        };
      })
    );

    // Transform the budgets into a category-based object
    const budgetObject = budgetsWithSpent.reduce((acc, budget) => {
      acc[budget.category] = budget.amount;
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        budgets: budgetObject
      }
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budgets'
    });
  }
});

// Create or update budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, period = 'monthly' } = req.body;

    // Input validation
    if (!category || !amount) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Category and amount are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Amount must be positive' 
      });
    }

    if (!['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'].includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category'
      });
    }

    if (!['weekly', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid period. Must be weekly, monthly, or yearly'
      });
    }

    // Calculate period dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (period === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (period === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Check if budget already exists
    const existingBudget = await Budget.findOne({
      userId: req.userId,
      category,
      period,
      isActive: true
    });

    if (existingBudget) {
      // Update existing budget
      existingBudget.amount = parseFloat(amount);
      existingBudget.startDate = startDate;
      existingBudget.endDate = endDate;
      existingBudget.alerts = {
        enabled: true,
        thresholds: [
          { percentage: 80, triggered: false },
          { percentage: 90, triggered: false },
          { percentage: 100, triggered: false }
        ]
      };
      await existingBudget.save();

      // Get all budgets for the user with spent amounts
      const allBudgets = await Budget.find({
        userId: req.userId,
        isActive: true
      });

      // Calculate spent amounts and transform to budgets object
      const budgetsWithSpent = await Promise.all(allBudgets.map(async (budget) => {
        const expenses = await Expense.find({
          userId: req.userId,
          category: budget.category,
          createdAt: { $gte: budget.startDate, $lte: budget.endDate }
        });
        const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        return {
          ...budget.toObject(),
          spent,
          remaining: budget.amount - spent
        };
      }));

      const budgets = budgetsWithSpent.reduce((acc, budget) => {
        acc[budget.category] = budget.amount;
        return acc;
      }, {});

      res.json({
        status: 'success',
        data: {
          message: 'Budget updated successfully',
          budgets
        }
      });
    } else {
      // Create new budget with alerts
      const budget = new Budget({
        userId: req.userId,
        category,
        amount: parseFloat(amount),
        period,
        startDate,
        endDate,
        alerts: {
          enabled: true,
          thresholds: [
            { percentage: 80, triggered: false },
            { percentage: 90, triggered: false },
            { percentage: 100, triggered: false }
          ]
        }
      });

      await budget.save();

      // Get all budgets including the new one
      const allBudgets = await Budget.find({
        userId: req.userId,
        isActive: true
      });

      // Transform to budgets object
      const budgets = allBudgets.reduce((acc, budget) => {
        acc[budget.category] = budget.amount;
        return acc;
      }, {});

      res.status(201).json({
        status: 'success',
        data: {
          message: 'Budget created successfully',
          budgets
        }
      });
    }
  } catch (error) {
    console.error('Create/update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget.isActive = false;
    await budget.save();

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get budget alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({
      userId: req.userId,
      isActive: true
    });

    const alerts = [];

    for (const budget of budgets) {
      const expenses = await Expense.find({
        userId: req.userId,
        category: budget.category,
        createdAt: {
          $gte: budget.startDate,
          $lte: budget.endDate
        }
      });

      const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const percentage = (spent / budget.amount) * 100;

      if (percentage >= 90) {
        alerts.push({
          type: 'budget-exceeded',
          category: budget.category,
          percentage: percentage.toFixed(1),
          spent,
          budget: budget.amount,
          severity: percentage >= 100 ? 'high' : 'medium'
        });
      }
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;