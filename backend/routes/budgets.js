const express = require('express');
const auth = require('../middleware/auth');
const {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  getBudgetAlerts,
  getHistoricalBudgets,
  getBudgetTrends,
  rolloverBudgets,
  resetBudgets
} = require('../controllers/budgetController');

const router = express.Router();

// Get user budgets
router.get('/', auth, getBudgets);

// Get historical budgets
router.get('/historical', auth, getHistoricalBudgets);

// Create or update budget
router.post('/', auth, createOrUpdateBudget);

// Delete budget
router.delete('/:id', auth, deleteBudget);

// Get budget alerts
router.get('/alerts', auth, getBudgetAlerts);

// Get budget trends
router.get('/trends', auth, getBudgetTrends);

// Rollover budgets to next period
router.post('/rollover', auth, rolloverBudgets);

// Reset budgets for new period
router.post('/reset', auth, resetBudgets);

module.exports = router;