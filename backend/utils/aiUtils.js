const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SplitBill = require('../models/SplitBill');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Google Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);

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
 * Generates spending predictions based on expenses and budgets using Google Gemini AI (Free)
 * @param {Array} expenses - User expenses
 * @param {Array} budgets - User budgets
 * @returns {Array} - Array of predictions
 */
async function generateSpendingPredictions(expenses, budgets) {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare data for Gemini
    const expenseData = expenses.map(exp => ({
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      date: exp.createdAt
    }));

    const budgetData = budgets.map(budget => ({
      category: budget.category,
      amount: budget.amount,
      spent: calculateCategorySpent(expenses, budget.category)
    }));

    const prompt = `
You are a financial advisor AI. Analyze the following spending data and budgets to provide personalized spending predictions and warnings.

Expenses (last 30 days):
${JSON.stringify(expenseData, null, 2)}

Budgets:
${JSON.stringify(budgetData, null, 2)}

Please provide spending predictions and warnings in the following JSON format:
{
  "predictions": [
    {
      "category": "category_name",
      "type": "warning|info|success",
      "message": "specific prediction message",
      "severity": "low|medium|high",
      "suggestion": "specific actionable suggestion",
      "remaining": number
    }
  ]
}

Focus on:
1. Budget overruns or near-overruns
2. Spending trends and patterns
3. Categories with unusual spending
4. Savings opportunities
5. Financial health indicators

Be specific, actionable, and encouraging. Keep messages concise but helpful.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return parsed.predictions || [];
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Fallback to basic analysis
      return generateBasicPredictions(expenses, budgets);
    }
  } catch (error) {
    console.error('Gemini API error in generateSpendingPredictions:', error);
    // Fallback to basic analysis
    return generateBasicPredictions(expenses, budgets);
  }
}

/**
 * Generates financial insights from expenses and budgets using Google Gemini AI (Free)
 * @param {Array} expenses - User expenses
 * @param {Array} budgets - User budgets
 * @returns {Array} - Array of insights
 */
async function generateFinancialInsights(expenses, budgets) {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare data for Gemini
    const expenseData = expenses.map(exp => ({
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      date: exp.createdAt
    }));

    const budgetData = budgets.map(budget => ({
      category: budget.category,
      amount: budget.amount,
      spent: calculateCategorySpent(expenses, budget.category)
    }));

    const prompt = `
You are a financial advisor AI. Analyze the following spending data and budgets to provide personalized financial insights and recommendations.

Expenses (last 30 days):
${JSON.stringify(expenseData, null, 2)}

Budgets:
${JSON.stringify(budgetData, null, 2)}

Please provide financial insights in the following JSON format:
{
  "insights": [
    {
      "type": "spending-pattern|savings|budget|trend|goal",
      "title": "concise title",
      "message": "specific insight message",
      "icon": "emoji representing the insight"
    }
  ]
}

Focus on:
1. Spending patterns and habits
2. Budget performance and adherence
3. Savings opportunities and potential
4. Financial goals and progress
5. Positive reinforcement and achievements
6. Areas for improvement

Be encouraging, specific, and actionable. Use appropriate emojis for visual appeal.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return parsed.insights || [];
    } catch (parseError) {
      console.error('Failed to parse Gemini response for insights:', parseError);
      // Fallback to basic insights
      return generateBasicInsights(expenses, budgets);
    }
  } catch (error) {
    console.error('Gemini API error in generateFinancialInsights:', error);
    // Fallback to basic insights
    return generateBasicInsights(expenses, budgets);
  }
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
 * Analyzes emotional spending patterns using Google Gemini AI (Free)
 * @param {Array} expenses - User expenses
 * @returns {Object} - Emotional analysis
 */
async function analyzeEmotionalSpending(expenses) {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare expense data for analysis
    const expenseData = expenses.map(exp => ({
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      hour: new Date(exp.createdAt).getHours(),
      day: new Date(exp.createdAt).getDay(),
      date: exp.createdAt
    }));

    const prompt = `
You are a behavioral finance expert. Analyze the following spending data to identify emotional spending patterns and triggers.

Spending Data (last 30 days):
${JSON.stringify(expenseData, null, 2)}

Please analyze for emotional spending patterns and provide insights in the following JSON format:
{
  "dominantEmotion": "stressed|happy|neutral|anxious|excited|frustrated",
  "triggers": ["array of identified triggers"],
  "recommendations": ["array of specific, actionable recommendations"],
  "confidence": 0.0-1.0
}

Consider:
1. Time patterns (late night spending, weekend spending)
2. Amount patterns (impulse buys, emotional purchases)
3. Category patterns (comfort spending, reward spending)
4. Frequency patterns (binge spending, regular small purchases)

Be empathetic, specific, and provide actionable advice.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return {
        dominantEmotion: parsed.dominantEmotion || 'neutral',
        triggers: parsed.triggers || [],
        recommendations: parsed.recommendations || getEmotionalRecommendations(parsed.dominantEmotion || 'neutral'),
        confidence: parsed.confidence || 0.75
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response for emotional analysis:', parseError);
      // Fallback to basic analysis
      return analyzeEmotionalSpendingBasic(expenses);
    }
  } catch (error) {
    console.error('Gemini API error in analyzeEmotionalSpending:', error);
    // Fallback to basic analysis
    return analyzeEmotionalSpendingBasic(expenses);
  }
}

/**
 * Calculates total spent in a specific category
 * @param {Array} expenses - User expenses
 * @param {string} category - Category to calculate
 * @returns {number} - Total spent in category
 */
function calculateCategorySpent(expenses, category) {
  return expenses
    .filter(exp => exp.category === category)
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
}

/**
 * Fallback function for basic emotional analysis when Gemini API fails
 * @param {Array} expenses - User expenses
 * @returns {Object} - Basic emotional analysis
 */
function analyzeEmotionalSpendingBasic(expenses) {
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

/**
 * Fallback function for basic predictions when Gemini API fails
 * @param {Array} expenses - User expenses
 * @param {Array} budgets - User budgets
 * @returns {Array} - Array of basic predictions
 */
function generateBasicPredictions(expenses, budgets) {
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
 * Fallback function for basic insights when Gemini API fails
 * @param {Array} expenses - User expenses
 * @param {Array} budgets - User budgets
 * @returns {Array} - Array of basic insights
 */
function generateBasicInsights(expenses, budgets) {
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
  getEmotionalRecommendations,
  calculateCategorySpent,
  generateBasicPredictions,
  generateBasicInsights,
  analyzeEmotionalSpendingBasic
};