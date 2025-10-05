const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const {
  buildBudgetQuery,
  calculateBudgetMetrics,
  transformBudgetsToObject,
  transformBudgetsToDetailedObject,
  calculateBudgetTotals,
  checkBudgetAlerts,
  groupBudgetsByPeriod,
  calculateBudgetTrends
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
 * Get historical budgets for a specific period
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getHistoricalBudgets(req, res) {
  try {
    const { period = 'monthly', year, month } = req.query;
    const userId = req.userId;

    let startDate, endDate;

    if (period === 'yearly' && year) {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else if (period === 'monthly' && year && month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const query = {
      userId,
      isActive: true,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    };

    const budgets = await Budget.find(query).sort({ startDate: -1, category: 1 });

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(calculateBudgetMetrics)
    );

    // Group by period for historical view
    const groupedBudgets = groupBudgetsByPeriod(budgetsWithSpent, period);

    res.json({
      status: 'success',
      data: {
        budgets: groupedBudgets,
        period,
        startDate,
        endDate
      },
      message: 'Historical budgets retrieved successfully'
    });
  } catch (error) {
    console.error('Get historical budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch historical budgets'
    });
  }
}

/**
 * Get budget trends and analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getBudgetTrends(req, res) {
  try {
    const { months = 6 } = req.query;
    const userId = req.userId;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const budgets = await Budget.find({
      userId,
      startDate: { $gte: startDate },
      endDate: { $lte: endDate }
    }).sort({ startDate: 1 });

    // Calculate metrics for each budget
    const budgetsWithMetrics = await Promise.all(
      budgets.map(calculateBudgetMetrics)
    );

    // Calculate trends
    const trends = calculateBudgetTrends(budgetsWithMetrics);

    res.json({
      status: 'success',
      data: { trends },
      message: 'Budget trends retrieved successfully'
    });
  } catch (error) {
    console.error('Get budget trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budget trends'
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
  getHistoricalBudgets,
  getBudgetTrends,
  getBudgetAlerts
};