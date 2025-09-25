const express = require('express');
const auth = require('../middleware/auth');
const {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  getBudgetAlerts
} = require('../controllers/budgetController');

const router = express.Router();

// Get user budgets
router.get('/', auth, getBudgets);

// Create or update budget
router.post('/', auth, createOrUpdateBudget);

// Delete budget
router.delete('/:id', auth, deleteBudget);

// Get budget alerts
router.get('/alerts', auth, getBudgetAlerts);

module.exports = router;