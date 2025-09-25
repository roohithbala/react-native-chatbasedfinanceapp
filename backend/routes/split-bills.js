const express = require('express');
const auth = require('../middleware/auth');
const splitBillController = require('../controllers/splitBillController');

const router = express.Router();

// Get split bills for user (both created by and participating in)
router.get('/', auth, async (req, res) => {
  try {
    const result = await splitBillController.getUserSplitBills(req.userId, req.query);

    res.json(result);
  } catch (error) {
    console.error('Get split bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new split bill
router.post('/', auth, async (req, res) => {
  try {
    const splitBill = await splitBillController.createSplitBill(req.userId, req.body);

    res.status(201).json({
      message: 'Split bill created successfully',
      splitBill
    });
  } catch (error) {
    console.error('Create split bill error:', error);
    const statusCode = error.message.includes('required') || error.message.includes('must') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Get split bill by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const splitBill = await splitBillController.getSplitBillById(req.params.id, req.userId);

    res.json({ splitBill });
  } catch (error) {
    console.error('Get split bill error:', error);
    const statusCode = error.message === 'Split bill not found' ? 404 :
                      error.message === 'Access denied' ? 403 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Mark payment as paid
router.patch('/:id/mark-paid', auth, async (req, res) => {
  try {
    const splitBill = await splitBillController.markPaymentAsPaid(req.params.id, req.userId);

    res.json({
      message: 'Payment marked as paid',
      splitBill
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    const statusCode = error.message === 'Split bill not found' ? 404 :
                      error.message === 'You are not a participant in this bill' ? 404 :
                      error.message === 'Payment already marked as paid' ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Get group split bills
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const result = await splitBillController.getGroupSplitBills(req.params.groupId, req.userId, req.query);

    res.json(result);
  } catch (error) {
    console.error('Get group split bills error:', error);
    const statusCode = error.message === 'Group not found' ? 404 :
                      error.message === 'Access denied' ? 403 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Get statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await splitBillController.getSplitBillStats(req.userId, req.query);

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
