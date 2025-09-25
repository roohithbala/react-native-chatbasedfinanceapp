const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SplitBill = require('../models/SplitBill');

/**
 * Validates period parameter
 * @param {string} period - Period to validate
 * @returns {boolean} - True if valid
 */
function isValidPeriod(period) {
  return ['week', 'month', 'year'].includes(period);
}

/**
 * Calculates start date based on period
 * @param {string} period - Period type
 * @returns {Date} - Start date
 */
function calculatePeriodStartDate(period) {
  const startDate = new Date();

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
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  return startDate;
}

/**
 * Groups expenses by category
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} - Category totals
 */
function groupExpensesByCategory(expenses) {
  return expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    const amount = Number(expense.amount) || 0;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});
}

/**
 * Calculates total amount from expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {number} - Total amount
 */
function calculateTotalExpenses(expenses) {
  return expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
}

/**
 * Calculates user's share in split bills
 * @param {Array} splitBills - Array of split bill objects
 * @param {string} userId - User ID
 * @returns {number} - Total share amount
 */
function calculateSplitBillShare(splitBills, userId) {
  return splitBills.reduce((sum, bill) => {
    const userParticipant = bill.participants.find(p =>
      p.userId.toString() === userId
    );
    return sum + (Number(userParticipant?.amount) || 0);
  }, 0);
}

/**
 * Generates spending predictions based on expenses and budgets
 * @param {Array} expenses - User expenses
 * @param {Array} budgets - User budgets
 * @returns {Array} - Array of predictions
 */
async function generateSpendingPredictions(expenses, budgets) {
  const predictions = [];

  // Group expenses by category
  const categorySpending = groupExpensesByCategory(expenses);

  // Analyze each budget category
  budgets.forEach(budget => {
    const spent = categorySpending[budget.category] || 0;
    const remaining = budget.amount - spent;
    const spentPercentage = (spent / budget.amount) * 100;

    if (spentPercentage > 80) {
      predictions.push({
        category: budget.category,
        type: 'warning',
        message: `You've spent ${spentPercentage.toFixed(0)}% of your ${budget.category} budget`,
        severity: spentPercentage > 100 ? 'high' : 'medium',
        suggestion: getSuggestionForCategory(budget.category),
        remaining: Number(budget.amount) - spent
      });
    }
  });

  // Trend analysis
  const weeklyTrend = analyzeWeeklyTrend(expenses);
  if (weeklyTrend.isIncreasing) {
    predictions.push({
      type: 'trend',
      message: `Your spending has increased by ${weeklyTrend.percentage.toFixed(1)}% this week`,
      severity: 'medium',
      suggestion: 'Consider reviewing your recent purchases and identifying areas to cut back'
    });
  }

  return predictions;
}

/**
 * Generates financial insights from expenses and budgets
 * @param {Array} expenses - User expenses
 * @param {Array} budgets - User budgets
 * @returns {Array} - Array of insights
 */
async function generateFinancialInsights(expenses, budgets) {
  const insights = [];

  // Most expensive category
  const categoryTotals = groupExpensesByCategory(expenses);
  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0];

  if (topCategory) {
    insights.push({
      type: 'spending-pattern',
      title: 'Top Spending Category',
      message: `${topCategory[0]} accounts for ₹${Number(topCategory[1]).toFixed(2)} of your spending`,
      icon: '📊'
    });
  }

  // Savings opportunity
  const totalSpent = calculateTotalExpenses(expenses);
  const avgDailySpending = totalSpent / 30;
  insights.push({
    type: 'savings',
    title: 'Daily Average',
    message: `You spend an average of ₹${avgDailySpending.toFixed(2)} per day`,
    icon: '💡'
  });

  return insights;
}

/**
 * Analyzes weekly spending trend
 * @param {Array} expenses - User expenses
 * @returns {Object} - Trend analysis
 */
function analyzeWeeklyTrend(expenses) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek = expenses.filter(exp => new Date(exp.createdAt) >= weekAgo);
  const lastWeek = expenses.filter(exp =>
    new Date(exp.createdAt) >= twoWeeksAgo && new Date(exp.createdAt) < weekAgo
  );

  const thisWeekTotal = calculateTotalExpenses(thisWeek);
  const lastWeekTotal = calculateTotalExpenses(lastWeek);

  const percentage = lastWeekTotal > 0 ?
    ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

  return {
    isIncreasing: percentage > 10,
    percentage: Math.abs(percentage),
    thisWeekTotal,
    lastWeekTotal
  };
}

/**
 * Gets spending suggestion for a category
 * @param {string} category - Expense category
 * @returns {string} - Suggestion text
 */
function getSuggestionForCategory(category) {
  const suggestions = {
    Food: 'Try meal planning and cooking at home more often',
    Transport: 'Consider using public transport or carpooling',
    Entertainment: 'Look for free local events and activities',
    Shopping: 'Create a shopping list and wait 24 hours before purchases',
    Bills: 'Review subscriptions and cancel unused services',
    Health: 'Check if expenses are covered by insurance',
    Other: 'Review and categorize these expenses for better tracking'
  };

  return suggestions[category] || 'Review your spending in this category';
}

/**
 * Analyzes emotional spending patterns
 * @param {Array} expenses - User expenses
 * @returns {Object} - Emotional analysis
 */
async function analyzeEmotionalSpending(expenses) {
  // Simulate emotional analysis based on spending patterns
  const timePatterns = expenses.map(exp => ({
    hour: new Date(exp.createdAt).getHours(),
    amount: exp.amount,
    category: exp.category
  }));

  // Late night spending might indicate stress
  const lateNightSpending = timePatterns.filter(p => p.hour >= 22 || p.hour <= 6);
  const weekendSpending = expenses.filter(exp => {
    const day = new Date(exp.createdAt).getDay();
    return day === 0 || day === 6;
  });

  let dominantEmotion = 'neutral';
  const triggers = [];

  if (lateNightSpending.length > expenses.length * 0.3) {
    dominantEmotion = 'stressed';
    triggers.push('late night spending');
  }

  if (weekendSpending.length > expenses.length * 0.4) {
    triggers.push('weekend impulse buying');
  }

  return {
    dominantEmotion,
    triggers,
    recommendations: getEmotionalRecommendations(dominantEmotion),
    confidence: 0.75
  };
}

/**
 * Gets emotional spending recommendations
 * @param {string} emotion - Dominant emotion
 * @returns {Array} - Array of recommendations
 */
function getEmotionalRecommendations(emotion) {
  const recommendations = {
    stressed: [
      'Try meditation or exercise before making purchases',
      'Set a cooling-off period for non-essential items',
      'Consider talking to someone about stress triggers'
    ],
    happy: [
      'Channel excitement into experiences rather than things',
      'Set aside celebration money in your budget',
      'Share your joy through free activities with friends'
    ],
    neutral: [
      'You have good spending control',
      'Consider automating savings to build wealth',
      'Review your goals and adjust budgets accordingly'
    ]
  };

  return recommendations[emotion] || recommendations.neutral;
}

module.exports = {
  isValidPeriod,
  calculatePeriodStartDate,
  groupExpensesByCategory,
  calculateTotalExpenses,
  calculateSplitBillShare,
  generateSpendingPredictions,
  generateFinancialInsights,
  analyzeWeeklyTrend,
  getSuggestionForCategory,
  analyzeEmotionalSpending,
  getEmotionalRecommendations
};