const express = require('express');
const auth = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

// Get user expenses
router.get('/', auth, async (req, res) => {
  try {
    const result = await expenseController.getUserExpenses(req.userId, req.query);

    res.json({
      status: 'success',
      data: result,
      message: 'Expenses retrieved successfully'
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Add expense
router.post('/', auth, async (req, res) => {
  try {
    const expense = await expenseController.createExpense(req.userId, req.body, req.io);

    res.status(201).json({
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    const statusCode = error.message.includes('required') || error.message.includes('positive') ? 400 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await expenseController.updateExpense(req.params.id, req.userId, req.body, req.io);

    res.json({
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    const statusCode = error.message === 'Expense not found' ? 404 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    await expenseController.deleteExpense(req.params.id, req.userId, req.io);

    res.json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    const statusCode = error.message === 'Expense not found' ? 404 : 500;
    res.status(statusCode).json({
      message: error.message
    });
  }
});

// Get expense statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await expenseController.getExpenseStats(req.userId, req.query.period);

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;