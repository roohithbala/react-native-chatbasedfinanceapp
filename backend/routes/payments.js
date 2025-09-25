const express = require('express');
const auth = require('../middleware/auth');
const {
  markParticipantAsPaid,
  confirmPayment,
  getPaymentSummary,
  getGroupSettlement,
  addPaymentReminder,
  getUserPaymentHistory,
  processGooglePayTransaction,
  refundGooglePayTransaction,
  createPaymentIntent
} = require('../controllers/paymentController');

const router = express.Router();

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

// Process Google Pay transaction
router.post('/google-pay', auth, processGooglePayTransaction);

// Refund Google Pay transaction
router.post('/google-pay/refund', auth, refundGooglePayTransaction);

// Create payment intent for Google Pay
router.post('/create-payment-intent', auth, createPaymentIntent);

module.exports = router;