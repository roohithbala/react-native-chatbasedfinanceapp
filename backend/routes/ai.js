const express = require('express');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SplitBill = require('../models/SplitBill');
const auth = require('../middleware/auth');

const router = express.Router();

// Get spending predictions
router.get('/predict/:userId?', auth, async (req, res) => {
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

    // Generate predictions
    const predictions = await generateSpendingPredictions(expenses, budgets);
    const insights = await generateFinancialInsights(expenses, budgets);

    res.json({
      predictions,
      insights,
      analysisDate: new Date()
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get emotional spending analysis
router.get('/emotions/:userId?', auth, async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    
    const expenses = await Expense.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const emotionalAnalysis = await analyzeEmotionalSpending(expenses);

    res.json({
      analysis: emotionalAnalysis,
      analysisDate: new Date()
    });
  } catch (error) {
    console.error('Emotional analysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get spending summary
router.get('/summary/:period?', auth, async (req, res) => {
  try {
    const period = req.params.period || 'month';
    let startDate = new Date();

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
    const totalPersonalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSplitExpenses = splitBills.reduce((sum, bill) => {
      const userParticipant = bill.participants.find(p => 
        p.userId.toString() === req.userId
      );
      return sum + (userParticipant ? userParticipant.amount : 0);
    }, 0);

    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    res.json({
      period,
      totalPersonalExpenses,
      totalSplitExpenses,
      totalExpenses: totalPersonalExpenses + totalSplitExpenses,
      categoryBreakdown,
      expenseCount: expenses.length,
      splitBillCount: splitBills.length
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI helper functions
async function generateSpendingPredictions(expenses, budgets) {
  const predictions = [];
  
  // Group expenses by category
  const categorySpending = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

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
        remaining
      });
    }
  });

  // Trend analysis
  const weeklyTrend = analyzeWeeklyTrend(expenses);
  if (weeklyTrend.isIncreasing) {
    predictions.push({
      type: 'trend',
      message: `Your spending has increased by ${weeklyTrend.percentage}% this week`,
      severity: 'medium',
      suggestion: 'Consider reviewing your recent purchases and identifying areas to cut back'
    });
  }

  return predictions;
}

async function generateFinancialInsights(expenses, budgets) {
  const insights = [];
  
  // Most expensive category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0];

  if (topCategory) {
    insights.push({
      type: 'spending-pattern',
      title: 'Top Spending Category',
      message: `${topCategory[0]} accounts for $${topCategory[1].toFixed(2)} of your spending`,
      icon: '📊'
    });
  }

  // Savings opportunity
  const avgDailySpending = expenses.reduce((sum, exp) => sum + exp.amount, 0) / 30;
  insights.push({
    type: 'savings',
    title: 'Daily Average',
    message: `You spend an average of $${avgDailySpending.toFixed(2)} per day`,
    icon: '💡'
  });

  return insights;
}

function analyzeWeeklyTrend(expenses) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek = expenses.filter(exp => new Date(exp.createdAt) >= weekAgo);
  const lastWeek = expenses.filter(exp => 
    new Date(exp.createdAt) >= twoWeeksAgo && new Date(exp.createdAt) < weekAgo
  );

  const thisWeekTotal = thisWeek.reduce((sum, exp) => sum + exp.amount, 0);
  const lastWeekTotal = lastWeek.reduce((sum, exp) => sum + exp.amount, 0);

  const percentage = lastWeekTotal > 0 ? 
    ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

  return {
    isIncreasing: percentage > 10,
    percentage: Math.abs(percentage),
    thisWeekTotal,
    lastWeekTotal
  };
}

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

module.exports = router;