const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const {
  isValidObjectId,
  validatePaymentData,
  validatePaymentConfirmationData,
  emitSplitBillUpdate,
  buildSplitBillResponse,
  isAuthorizedForSplitBill
} = require('../utils/paymentUtils');

/**
 * Mark a participant as paid
 */
async function markParticipantAsPaid(req, res) {
  try {
    const { splitBillId, participantId } = req.params;
    const { paymentMethod, notes } = req.body;

    // Validate input data
    const validation = validatePaymentData({ splitBillId, participantId, paymentMethod });
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validation.errors.join(', ')
      });
    }

    const splitBill = await SplitBill.findById(splitBillId)
      .populate('participants.userId', 'name')
      .populate('createdBy', 'name');

    if (!splitBill) {
      return res.status(404).json({
        status: 'error',
        message: 'Split bill not found'
      });
    }

    // Check if user is authorized
    if (!isAuthorizedForSplitBill(splitBill, req.userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to modify this split bill'
      });
    }

    // Mark participant as paid
    await splitBill.markParticipantAsPaid(participantId, paymentMethod, notes);

    // Emit real-time update
    emitSplitBillUpdate(req.io, splitBill, participantId, paymentMethod, req.userId);

    res.json({
      status: 'success',
      message: 'Payment recorded successfully',
      data: {
        splitBill: buildSplitBillResponse(splitBill)
      }
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
}

/**
 * Confirm a payment
 */
async function confirmPayment(req, res) {
  try {
    const { splitBillId, paymentId } = req.params;

    // Validate input data
    const validation = validatePaymentConfirmationData({ splitBillId, paymentId });
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validation.errors.join(', ')
      });
    }

    const splitBill = await SplitBill.findById(splitBillId);

    if (!splitBill) {
      return res.status(404).json({
        status: 'error',
        message: 'Split bill not found'
      });
    }

    // Check if user is authorized
    if (!isAuthorizedForSplitBill(splitBill, req.userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to confirm payments for this split bill'
      });
    }

    await splitBill.confirmPayment(paymentId, req.userId);

    res.json({
      status: 'success',
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
}

/**
 * Process Google Pay transaction
 */
async function processGooglePayTransaction(req, res) {
  try {
    const {
      paymentMethodId,
      amount,
      currency,
      description,
      recipientId,
      splitBillId,
      groupId
    } = req.body;

    // Validate required fields
    if (!paymentMethodId || !amount || !currency) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required payment data'
      });
    }

    // Here you would integrate with Stripe to process the payment
    // For now, we'll simulate a successful transaction
    const transactionId = `gpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // If this is for a split bill, mark the participant as paid
    if (splitBillId && recipientId) {
      const splitBill = await SplitBill.findById(splitBillId);
      if (splitBill) {
        await splitBill.markParticipantAsPaid(recipientId, 'google_pay', `Google Pay transaction: ${transactionId}`);
      }
    }

    // Log the transaction (you might want to store this in a separate collection)
    console.log('Google Pay transaction processed:', {
      transactionId,
      amount,
      currency,
      description,
      recipientId,
      splitBillId,
      groupId,
      userId: req.userId,
    });

    res.json({
      status: 'success',
      message: 'Payment processed successfully',
      data: {
        transactionId,
        amount,
        currency,
        description,
        processedAt: new Date(),
      }
    });
  } catch (error) {
    console.error('Google Pay transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Payment processing failed'
    });
  }
}

/**
 * Refund Google Pay transaction
 */
async function refundGooglePayTransaction(req, res) {
  try {
    const { transactionId, amount } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction ID is required'
      });
    }

    // Here you would integrate with Stripe to process the refund
    // For now, we'll simulate a successful refund
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log the refund
    console.log('Google Pay refund processed:', {
      refundId,
      originalTransactionId: transactionId,
      amount,
      userId: req.userId,
    });

    res.json({
      status: 'success',
      message: 'Refund processed successfully',
      data: {
        refundId,
        originalTransactionId: transactionId,
        amount,
        processedAt: new Date(),
      }
    });
  } catch (error) {
    console.error('Google Pay refund error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Refund processing failed'
    });
  }
}

/**
 * Create payment intent for Google Pay
 */
async function createPaymentIntent(req, res) {
  try {
    const {
      amount,
      currency,
      description,
      recipientId,
      splitBillId,
      groupId
    } = req.body;

    // Validate required fields
    if (!amount || !currency) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount and currency are required'
      });
    }

    // Here you would integrate with Stripe to create a payment intent
    // For now, we'll simulate creating a payment intent
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;

    // Log the payment intent creation
    console.log('Payment intent created:', {
      paymentIntentId,
      amount,
      currency,
      description,
      recipientId,
      splitBillId,
      groupId,
      userId: req.userId,
    });

    res.json({
      status: 'success',
      message: 'Payment intent created successfully',
      data: {
        paymentIntentId,
        clientSecret,
        amount,
        currency,
        description,
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Payment intent creation failed'
    });
  }
}

module.exports = {
  markParticipantAsPaid,
  confirmPayment,
  processGooglePayTransaction,
  refundGooglePayTransaction,
  createPaymentIntent
};