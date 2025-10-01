const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const {
  buildBudgetQuery,
  calculateBudgetMetrics,
  transformBudgetsToObject,
  transformBudgetsToDetailedObject,
  calculateBudgetTotals,
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
  getBudgetAlerts
};