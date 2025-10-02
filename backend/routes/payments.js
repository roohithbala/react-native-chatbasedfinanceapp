const express = require('express');
const auth = require('../middleware/auth');
const {
  markParticipantAsPaid,
  confirmPayment,
  getPaymentSummary,
  getGroupSettlement,
  addPaymentReminder,
  getUserPaymentHistory,
  processBhimUpiTransaction,
  refundBhimUpiTransaction,
  createBhimUpiPaymentIntent,
  verifyBhimUpiPayment,
  generateUpiQrCode,
  markCurrentUserAsPaid
} = require('../controllers/paymentController');

const router = express.Router();

// Mark current user as paid (self-marking)
router.patch('/:splitBillId/mark-paid', auth, markCurrentUserAsPaid);

// Mark participant as paid
router.post('/:splitBillId/participants/:participantId/pay', auth, markParticipantAsPaid);

// Confirm payment
router.post('/:splitBillId/payments/:paymentId/confirm', auth, confirmPayment);

// Get payment summary for a split bill
router.get('/:splitBillId/summary', auth, getPaymentSummary);

// Get group settlement plan
router.get('/groups/:groupId/settlement', auth, getGroupSettlement);

// Add payment reminder
router.post('/:splitBillId/reminders', auth, addPaymentReminder);

// Get user's payment history
router.get('/users/:userId/history', auth, getUserPaymentHistory);

// Process BHIM UPI transaction
router.post('/bhim-upi', auth, processBhimUpiTransaction);

// Refund BHIM UPI transaction
router.post('/bhim-upi/refund', auth, refundBhimUpiTransaction);

// Create payment intent for BHIM UPI
router.post('/create-bhim-upi-intent', auth, createBhimUpiPaymentIntent);

// Verify BHIM UPI payment status
router.get('/bhim-upi/verify/:transactionId', auth, verifyBhimUpiPayment);

// Generate UPI QR Code
router.post('/generate-upi-qr', auth, generateUpiQrCode);

module.exports = router;