const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const {
  validateBudgetData,
  calculatePeriodDates,
  transformBudgetsToObject,
  createDefaultAlerts
} = require('../utils/budgetUtils');

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
 * Roll over budgets to next period
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function rolloverBudgets(req, res) {
  try {
    const { rolloverUnused = true, rolloverPercentage = 100 } = req.body;

    // Find all active budgets for the user
    const budgets = await Budget.find({
      userId: req.userId,
      isActive: true
    });

    const rolledOverBudgets = [];

    for (const budget of budgets) {
      // Calculate spent amount
      const expenses = await Expense.find({
        userId: req.userId,
        category: budget.category,
        createdAt: { $gte: budget.startDate, $lte: budget.endDate }
      });
      const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const remaining = budget.amount - spent;

      // Calculate new budget amount
      let newAmount = budget.amount;
      if (rolloverUnused && remaining > 0) {
        const rolloverAmount = (remaining * rolloverPercentage) / 100;
        newAmount = budget.amount + rolloverAmount;
      }

      // Calculate next period dates
      const { startDate, endDate } = calculatePeriodDates(budget.period);

      // Create new budget for next period
      const newBudget = new Budget({
        userId: req.userId,
        groupId: budget.groupId,
        category: budget.category,
        amount: newAmount,
        period: budget.period,
        startDate,
        endDate,
        alerts: createDefaultAlerts()
      });

      await newBudget.save();
      rolledOverBudgets.push(newBudget);

      // Deactivate current budget
      budget.isActive = false;
      await budget.save();
    }

    res.json({
      status: 'success',
      data: {
        rolledOverBudgets: rolledOverBudgets.length,
        message: `Successfully rolled over ${rolledOverBudgets.length} budgets to next period`
      }
    });
  } catch (error) {
    console.error('Rollover budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to rollover budgets'
    });
  }
}

/**
 * Reset budgets for new period
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function resetBudgets(req, res) {
  try {
    const { period = 'monthly', resetAmount } = req.body;

    // Find all active budgets for the user
    const budgets = await Budget.find({
      userId: req.userId,
      isActive: true
    });

    const resetBudgets = [];

    for (const budget of budgets) {
      // Calculate new period dates
      const { startDate, endDate } = calculatePeriodDates(period);

      // Create new budget with reset amount or keep current
      const newAmount = resetAmount !== undefined ? parseFloat(resetAmount) : budget.amount;

      const newBudget = new Budget({
        userId: req.userId,
        groupId: budget.groupId,
        category: budget.category,
        amount: newAmount,
        period,
        startDate,
        endDate,
        alerts: createDefaultAlerts()
      });

      await newBudget.save();
      resetBudgets.push(newBudget);

      // Deactivate current budget
      budget.isActive = false;
      await budget.save();
    }

    res.json({
      status: 'success',
      data: {
        resetBudgets: resetBudgets.length,
        message: `Successfully reset ${resetBudgets.length} budgets for new period`
      }
    });
  } catch (error) {
    console.error('Reset budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset budgets'
    });
  }
}

module.exports = {
  createOrUpdateBudget,
  deleteBudget,
  rolloverBudgets,
  resetBudgets
};