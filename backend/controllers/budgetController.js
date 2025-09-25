const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const {
  validateBudgetData,
  calculatePeriodDates,
  buildBudgetQuery,
  calculateBudgetMetrics,
  transformBudgetsToObject,
  transformBudgetsToDetailedObject,
  calculateBudgetTotals,
  createDefaultAlerts,
  checkBudgetAlerts
} = require('../utils/budgetUtils');

/**
 * Get user budgets with spent amounts and metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getBudgets(req, res) {
  try {
    const query = buildBudgetQuery(req.userId, req.query);
    const budgets = await Budget.find(query).sort({ category: 1 });

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(calculateBudgetMetrics)
    );

    // Transform budgets for frontend compatibility
    const budgetObject = transformBudgetsToObject(budgetsWithSpent);
    const detailedBudgets = transformBudgetsToDetailedObject(budgetsWithSpent);
    const totals = calculateBudgetTotals(budgetsWithSpent);

    res.json({
      status: 'success',
      data: {
        budgets: budgetObject, // Simple format for frontend compatibility
        detailedBudgets, // Detailed format for advanced features
        ...totals
      },
      message: 'Budgets retrieved successfully'
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budgets'
    });
  }
}

/**
 * Create or update a budget
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createOrUpdateBudget(req, res) {
  try {
    const { category, amount, period = 'monthly' } = req.body;

    // Validate input data
    const validation = validateBudgetData({ category, amount, period });
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validation.errors.join(', ')
      });
    }

    // Calculate period dates
    const { startDate, endDate } = calculatePeriodDates(period);

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
      existingBudget.alerts = createDefaultAlerts();
      await existingBudget.save();

      // Get all budgets for the user with spent amounts
      const allBudgets = await Budget.find({
        userId: req.userId,
        isActive: true
      });

      const budgetsWithSpent = await Promise.all(
        allBudgets.map(async (budget) => {
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
        })
      );

      const budgets = transformBudgetsToObject(budgetsWithSpent);

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
        alerts: createDefaultAlerts()
      });

      await budget.save();

      // Get all budgets including the new one
      const allBudgets = await Budget.find({
        userId: req.userId,
        isActive: true
      });

      const budgets = transformBudgetsToObject(allBudgets);

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
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

/**
 * Delete a budget (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteBudget(req, res) {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!budget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found'
      });
    }

    budget.isActive = false;
    await budget.save();

    res.json({
      status: 'success',
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

/**
 * Get budget alerts for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getBudgetAlerts(req, res) {
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
      const budgetAlerts = await checkBudgetAlerts(budget, spent);
      alerts.push(...budgetAlerts);
    }

    res.json({
      status: 'success',
      data: { alerts },
      message: 'Alerts retrieved successfully'
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

module.exports = {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  getBudgetAlerts
};