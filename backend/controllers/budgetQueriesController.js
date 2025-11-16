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
const { calculatePeriodDates, createDefaultAlerts } = require('../utils/budgetUtils');

/**
 * Get user budgets with spent amounts and metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getBudgets(req, res) {
  try {
    const query = buildBudgetQuery(req.userId, req.query);
    const period = req.query?.period || 'monthly';
    const groupId = req.query?.groupId;

    // Fetch all active budgets (may include expired ones if not cleaned up earlier)
    let budgets = await Budget.find(query).sort({ category: 1 });

    const now = new Date();
    const currentBudgets = [];

    // Deactivate any active budgets that are expired, and collect budgets that are current
    for (const budget of budgets) {
      if (budget.startDate <= now && budget.endDate >= now) {
        currentBudgets.push(budget);
      } else {
        // If budget is marked active but has already expired, deactivate it so we don't show stale entries
        if (budget.isActive && budget.endDate < now) {
          budget.isActive = false;
          try {
            await budget.save();
          } catch (e) {
            console.warn('Failed to deactivate expired budget', budget._id, e.message);
          }
        }
      }
    }

    // Determine all categories user has ever had budgets for (respect groupId if present)
    const distinctQuery = { isActive: { $in: [true, false] } };
    if (groupId) distinctQuery.groupId = groupId; else distinctQuery.userId = req.userId;
    const allCategories = await Budget.distinct('category', distinctQuery);

    // For any category that does not have a current budget, create a new zeroed budget for the current period
    const categoriesPresent = new Set(currentBudgets.map(b => b.category));
    for (const category of allCategories) {
      if (!categoriesPresent.has(category)) {
        const { startDate, endDate } = calculatePeriodDates(period);
        const newBudget = new Budget({
          userId: req.userId,
          groupId: groupId || undefined,
          category,
          amount: 0,
          period,
          startDate,
          endDate,
          alerts: createDefaultAlerts()
        });
        await newBudget.save();
        currentBudgets.push(newBudget);
      }
    }

    // Calculate spent amounts for each current budget
    const budgetsWithSpent = await Promise.all(
      currentBudgets.map(calculateBudgetMetrics)
    );

    // Transform budgets for frontend compatibility
    const budgetObject = transformBudgetsToObject(budgetsWithSpent);
    const detailedBudgets = transformBudgetsToDetailedObject(budgetsWithSpent);
    const totals = calculateBudgetTotals(budgetsWithSpent);

    res.json({
      status: 'success',
      data: {
        budgets: budgetObject,
        detailedBudgets,
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
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
    } else if (period === 'monthly' && year && month) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    console.log('📅 Historical budgets query:', {
      userId,
      period,
      year,
      month,
      startDate,
      endDate
    });

    const query = {
      userId,
      isActive: true,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    };

    const budgets = await Budget.find(query).sort({ startDate: -1, category: 1 });

    console.log('📅 Found historical budgets:', budgets.length);

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(calculateBudgetMetrics)
    );

    // Also fetch raw expenses for the requested period so the frontend
    // can display transactions even if no budgets exist for that month/year
    const expensesQuery = {
      userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
    const periodExpenses = await Expense.find(expensesQuery).sort({ createdAt: -1 });
    console.log('📅 Found historical expenses for period:', periodExpenses.length);

    // Group by period for historical view
    const groupedBudgets = groupBudgetsByPeriod(budgetsWithSpent, period);

    console.log('📅 Grouped budgets:', {
      periods: Object.keys(groupedBudgets).length,
      keys: Object.keys(groupedBudgets)
    });

    res.json({
      status: 'success',
      data: {
        budgets: groupedBudgets,
        period,
        startDate,
        endDate
      ,
        // provide raw expenses and an expenses-by-category map for the period
        expenses: periodExpenses,
        expensesByCategory: periodExpenses.reduce((acc, exp) => {
          const cat = exp.category || 'Uncategorized';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(exp);
          return acc;
        }, {})
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
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    console.log('📊 Budget trends query:', {
      userId,
      startDate,
      endDate,
      months: parseInt(months)
    });

    // Find budgets that overlap with the date range
    // Changed query: get budgets where startDate is before endDate AND endDate is after startDate
    const budgets = await Budget.find({
      userId,
      isActive: true,
      $or: [
        // Budget starts within range
        { startDate: { $gte: startDate, $lte: endDate } },
        // Budget ends within range
        { endDate: { $gte: startDate, $lte: endDate } },
        // Budget spans entire range
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ]
    }).sort({ startDate: 1 });

    console.log('📊 Found budgets:', budgets.length);

    // Calculate metrics for each budget
    const budgetsWithMetrics = await Promise.all(
      budgets.map(calculateBudgetMetrics)
    );

    console.log('📊 Budgets with metrics:', budgetsWithMetrics.length);

    // Calculate trends
    const trends = calculateBudgetTrends(budgetsWithMetrics);

    console.log('📊 Calculated trends:', {
      monthlyTrendsCount: trends.monthlyTrends?.length || 0,
      categoryTrendsCount: Object.keys(trends.categoryTrends || {}).length,
      overallMetrics: trends.overallMetrics
    });

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