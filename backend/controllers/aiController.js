const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SplitBill = require('../models/SplitBill');
const {
  isValidPeriod,
  calculatePeriodStartDate,
  groupExpensesByCategory,
  calculateTotalExpenses,
  calculateSplitBillShare,
  generateSpendingPredictions,
  generateFinancialInsights,
  analyzeEmotionalSpending
} = require('../utils/aiUtils');

/**
 * Get spending predictions for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSpendingPredictions(req, res) {
  try {
    const userId = req.params.userId || req.userId;

    // Get user expenses from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await Expense.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const budgets = await Budget.find({
      userId,
      isActive: true
    });

    // Generate predictions and insights
    const predictions = await generateSpendingPredictions(expenses, budgets);
    const insights = await generateFinancialInsights(expenses, budgets);

    res.json({
      status: 'success',
      data: {
        predictions,
        insights,
        analysisDate: new Date()
      }
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

/**
 * Get emotional spending analysis for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getEmotionalSpendingAnalysis(req, res) {
  try {
    const userId = req.params.userId || req.userId;

    const expenses = await Expense.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const emotionalAnalysis = await analyzeEmotionalSpending(expenses);

    res.json({
      status: 'success',
      data: {
        analysis: emotionalAnalysis,
        analysisDate: new Date()
      }
    });
  } catch (error) {
    console.error('Emotional analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

/**
 * Get spending summary for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSpendingSummary(req, res) {
  try {
    const period = req.params.period || 'month';

    if (!isValidPeriod(period)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid period. Must be week, month, or year'
      });
    }

    const startDate = calculatePeriodStartDate(period);

    // Get expenses
    const expenses = await Expense.find({
      userId: req.userId,
      createdAt: { $gte: startDate }
    });

    // Get split bills
    const splitBills = await SplitBill.find({
      'participants.userId': req.userId,
      createdAt: { $gte: startDate }
    });

    // Calculate totals
    const totalPersonalExpenses = calculateTotalExpenses(expenses);
    const totalSplitExpenses = calculateSplitBillShare(splitBills, req.userId);

    // Category breakdown
    const categoryBreakdown = groupExpensesByCategory(expenses);

    res.json({
      status: 'success',
      data: {
        period,
        totalPersonalExpenses,
        totalSplitExpenses,
        totalExpenses: totalPersonalExpenses + totalSplitExpenses,
        categoryBreakdown,
        expenseCount: expenses.length,
        splitBillCount: splitBills.length
      }
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

module.exports = {
  getSpendingPredictions,
  getEmotionalSpendingAnalysis,
  getSpendingSummary
};