const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

/**
 * Validates budget input data
 * @param {
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
  let spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Include split bills as expenses for budget tracking
  const SplitBill = require('../models/SplitBill');
  const splitBillQuery = {
    category: budget.category,
    createdAt: expenseQuery.createdAt,
    'participants.userId': budget.userId,
    'participants.status': 'pending' // Only count pending split bills as they represent outstanding expenses
  };

  const splitBills = await SplitBill.find(splitBillQuery);
  const splitBillSpent = splitBills.reduce((sum, bill) => {
    const userParticipant = bill.participants.find(p => p.userId.toString() === budget.userId.toString());
    return sum + (userParticipant ? userParticipant.amount : 0);
  }, 0);

  spent += splitBillSpent;

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

/**
 * Groups budgets by period for historical view
 * @param {Array} budgets - Array of budget objects with metrics
 * @param {string} period - Period type (monthly, yearly)
 * @returns {Object} - Grouped budgets by period
 */
function groupBudgetsByPeriod(budgets, period) {
  const grouped = {};

  budgets.forEach(budget => {
    let periodKey;

    if (period === 'yearly') {
      periodKey = budget.startDate.getFullYear().toString();
    } else if (period === 'monthly') {
      const month = budget.startDate.getMonth() + 1;
      const year = budget.startDate.getFullYear();
      periodKey = `${year}-${month.toString().padStart(2, '0')}`;
    } else {
      periodKey = 'current';
    }

    if (!grouped[periodKey]) {
      grouped[periodKey] = {
        period: periodKey,
        startDate: budget.startDate,
        endDate: budget.endDate,
        budgets: {},
        totals: {
          totalAmount: 0,
          totalSpent: 0,
          totalRemaining: 0,
          categories: 0
        }
      };
    }

    grouped[periodKey].budgets[budget.category] = {
      amount: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
      percentage: budget.percentage,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate
    };

    grouped[periodKey].totals.totalAmount += budget.amount;
    grouped[periodKey].totals.totalSpent += budget.spent;
    grouped[periodKey].totals.totalRemaining += budget.remaining;
    grouped[periodKey].totals.categories += 1;
  });

  return grouped;
}

/**
 * Calculates budget trends and analytics
 * @param {Array} budgets - Array of budget objects with metrics
 * @returns {Object} - Budget trends data
 */
function calculateBudgetTrends(budgets) {
  if (budgets.length === 0) {
    return {
      monthlyTrends: [],
      categoryTrends: {},
      overallMetrics: {
        averageBudgetUtilization: 0,
        totalBudgets: 0,
        totalOverspent: 0,
        bestCategory: null,
        worstCategory: null
      }
    };
  }

  // Group by month
  const monthlyTrends = [];
  const categoryTrends = {};
  const monthlyData = {};

  budgets.forEach(budget => {
    const monthKey = `${budget.startDate.getFullYear()}-${(budget.startDate.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        totalBudget: 0,
        totalSpent: 0,
        categories: 0,
        overspentCategories: 0
      };
    }

    monthlyData[monthKey].totalBudget += budget.amount;
    monthlyData[monthKey].totalSpent += budget.spent;
    monthlyData[monthKey].categories += 1;

    if (budget.spent > budget.amount) {
      monthlyData[monthKey].overspentCategories += 1;
    }

    // Category trends
    if (!categoryTrends[budget.category]) {
      categoryTrends[budget.category] = {
        category: budget.category,
        totalBudget: 0,
        totalSpent: 0,
        averageUtilization: 0,
        overspentCount: 0,
        periods: 0
      };
    }

    categoryTrends[budget.category].totalBudget += budget.amount;
    categoryTrends[budget.category].totalSpent += budget.spent;
    categoryTrends[budget.category].periods += 1;

    if (budget.spent > budget.amount) {
      categoryTrends[budget.category].overspentCount += 1;
    }
  });

  // Convert monthly data to array and calculate utilization
  Object.values(monthlyData).forEach(month => {
    month.utilization = month.totalBudget > 0 ? (month.totalSpent / month.totalBudget) * 100 : 0;
    monthlyTrends.push(month);
  });

  // Sort monthly trends by date
  monthlyTrends.sort((a, b) => a.month.localeCompare(b.month));

  // Calculate category metrics
  Object.values(categoryTrends).forEach(cat => {
    cat.averageUtilization = cat.totalBudget > 0 ? (cat.totalSpent / cat.totalBudget) * 100 : 0;
  });

  // Overall metrics
  const totalBudgets = budgets.length;
  const totalOverspent = budgets.filter(b => b.spent > b.amount).length;
  const averageUtilization = budgets.reduce((sum, b) => sum + b.percentage, 0) / budgets.length;

  const categoryArray = Object.values(categoryTrends);
  const bestCategory = categoryArray.reduce((best, cat) =>
    !best || cat.averageUtilization < best.averageUtilization ? cat : best, null);
  const worstCategory = categoryArray.reduce((worst, cat) =>
    !worst || cat.averageUtilization > worst.averageUtilization ? cat : worst, null);

  return {
    monthlyTrends,
    categoryTrends,
    overallMetrics: {
      averageBudgetUtilization: averageUtilization,
      totalBudgets,
      totalOverspent,
      bestCategory: bestCategory ? bestCategory.category : null,
      worstCategory: worstCategory ? worstCategory.category : null
    }
  };
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
  checkBudgetAlerts,
  groupBudgetsByPeriod,
  calculateBudgetTrends
};