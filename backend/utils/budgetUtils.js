const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

/**
 * Validates budget input data
 * @param {Object} data - Budget data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validateBudgetData(data) {
  const errors = [];

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!data.amount) {
    errors.push('Amount is required');
  } else if (data.amount <= 0) {
    errors.push('Amount must be positive');
  }

  if (data.category && !['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'].includes(data.category)) {
    errors.push('Invalid category. Must be one of: Food, Transport, Entertainment, Shopping, Bills, Health, Other');
  }

  if (data.period && !['weekly', 'monthly', 'yearly'].includes(data.period)) {
    errors.push('Invalid period. Must be weekly, monthly, or yearly');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates period start and end dates
 * @param {string} period - Budget period (weekly, monthly, yearly)
 * @returns {Object} - Object with startDate and endDate
 */
function calculatePeriodDates(period) {
  const startDate = new Date();
  const endDate = new Date();

  if (period === 'weekly') {
    endDate.setDate(endDate.getDate() + 7);
  } else if (period === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (period === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return { startDate, endDate };
}

/**
 * Builds query for finding budgets
 * @param {string} userId - User ID
 * @param {Object} filters - Additional filters
 * @returns {Object} - MongoDB query object
 */
function buildBudgetQuery(userId, filters = {}) {
  const { period = 'monthly', groupId } = filters;

  let query = {
    period,
    isActive: true
  };

  // If groupId is provided, get group budgets instead
  if (groupId) {
    query.groupId = groupId;
  } else {
    query.userId = userId;
  }

  return query;
}

/**
 * Builds query for finding expenses within budget period
 * @param {Object} budget - Budget object
 * @returns {Object} - MongoDB query object
 */
function buildExpenseQuery(budget) {
  const expenseQuery = {
    category: budget.category,
    createdAt: {
      $gte: budget.startDate,
      $lte: budget.endDate
    }
  };

  // If it's a group budget, get expenses for the group
  if (budget.groupId) {
    expenseQuery.groupId = budget.groupId;
  } else {
    expenseQuery.userId = budget.userId;
  }

  return expenseQuery;
}

/**
 * Calculates spent amount and budget metrics for a budget
 * @param {Object} budget - Budget object
 * @returns {Object} - Budget with calculated metrics
 */
async function calculateBudgetMetrics(budget) {
  const expenseQuery = buildExpenseQuery(budget);
  const expenses = await Expense.find(expenseQuery);
  const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return {
    ...budget.toObject(),
    spent,
    remaining: budget.amount - spent,
    percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
  };
}

/**
 * Transforms budgets array into category-based object
 * @param {Array} budgets - Array of budget objects
 * @returns {Object} - Category-based budget object
 */
function transformBudgetsToObject(budgets) {
  return budgets.reduce((acc, budget) => {
    acc[budget.category] = budget.amount;
    return acc;
  }, {});
}

/**
 * Transforms budgets array into detailed category-based object
 * @param {Array} budgets - Array of budget objects with metrics
 * @returns {Object} - Detailed category-based budget object
 */
function transformBudgetsToDetailedObject(budgets) {
  return budgets.reduce((acc, budget) => {
    acc[budget.category] = {
      amount: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
      percentage: budget.percentage,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      isGroupBudget: !!budget.groupId
    };
    return acc;
  }, {});
}

/**
 * Calculates total budget statistics
 * @param {Array} budgets - Array of budget objects with metrics
 * @returns {Object} - Total statistics
 */
function calculateBudgetTotals(budgets) {
  return {
    totalBudgets: budgets.length,
    totalAmount: budgets.reduce((sum, b) => sum + b.amount, 0),
    totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0),
    totalRemaining: budgets.reduce((sum, b) => sum + b.remaining, 0)
  };
}

/**
 * Creates default budget alerts configuration
 * @returns {Object} - Alerts configuration
 */
function createDefaultAlerts() {
  return {
    enabled: true,
    thresholds: [
      { percentage: 80, triggered: false },
      { percentage: 90, triggered: false },
      { percentage: 100, triggered: false }
    ]
  };
}

/**
 * Checks if budget alerts should be triggered
 * @param {Object} budget - Budget object
 * @param {number} spent - Amount spent
 * @returns {Array} - Array of triggered alerts
 */
async function checkBudgetAlerts(budget, spent) {
  const alerts = [];
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

  return alerts;
}

module.exports = {
  validateBudgetData,
  calculatePeriodDates,
  buildBudgetQuery,
  buildExpenseQuery,
  calculateBudgetMetrics,
  transformBudgetsToObject,
  transformBudgetsToDetailedObject,
  calculateBudgetTotals,
  createDefaultAlerts,
  checkBudgetAlerts
};