const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const Group = require('../models/Group');
const {
  isValidObjectId,
  validatePaymentData,
  validatePaymentConfirmationData,
  validateReminderData,
  isAuthorizedForSplitBill,
  isAuthorizedToSendReminders,
  isGroupMember,
  buildPaymentHistoryQuery,
  buildPaginationParams,
  emitSplitBillUpdate,
  buildSplitBillResponse,
  buildDetailedSplitBillResponse
} = require('../utils/paymentUtils');

/**
 * Mark a participant as paid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * Get payment summary for a split bill
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPaymentSummary(req, res) {
  try {
    const { splitBillId } = req.params;

    if (!isValidObjectId(splitBillId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid split bill ID'
      });
    }

    const splitBill = await SplitBill.findById(splitBillId)
      .populate('participants.userId', 'name avatar')
      .populate('createdBy', 'name avatar')
      .populate('payments.fromUserId', 'name')
      .populate('payments.toUserId', 'name')
      .populate('payments.confirmedBy.userId', 'name');

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
        message: 'Not authorized to view this split bill'
      });
    }

    const summary = splitBill.getPaymentSummary();
    const debts = splitBill.getDebts();

    res.json({
      status: 'success',
      data: {
        splitBill: buildDetailedSplitBillResponse(splitBill),
        summary,
        debts
      }
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

/**
 * Get group settlement plan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getGroupSettlement(req, res) {
  try {
    const { groupId } = req.params;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member of the group
    if (!isGroupMember(group, req.userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view group settlement'
      });
    }

    const settlement = await SplitBill.calculateGroupSettlement(groupId);

    res.json({
      status: 'success',
      data: {
        settlement,
        group: {
          _id: group._id,
          name: group.name
        }
      }
    });
  } catch (error) {
    console.error('Get group settlement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

/**
 * Add payment reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function addPaymentReminder(req, res) {
  try {
    const { splitBillId } = req.params;
    const { userId, type, message } = req.body;

    // Validate input data
    const validation = validateReminderData({ splitBillId, userId, type, message });
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

    // Only creator can send reminders
    if (!isAuthorizedToSendReminders(splitBill, req.userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the bill creator can send reminders'
      });
    }

    await splitBill.addReminder(userId, type, message);

    res.json({
      status: 'success',
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('Add reminder error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
}

/**
 * Get user's payment history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserPaymentHistory(req, res) {
  try {
    const { userId } = req.params;

    // Users can only view their own payment history
    if (userId !== req.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this payment history'
      });
    }

    const { page, limit, skip } = buildPaginationParams(req.query);
    const pipeline = buildPaymentHistoryQuery(userId);

    // Add pagination to pipeline
    pipeline.push({ $skip: skip }, { $limit: limit });

    const payments = await SplitBill.aggregate(pipeline);

    const total = await SplitBill.countDocuments({
      $or: [
        { createdBy: mongoose.Types.ObjectId(userId) },
        { 'participants.userId': mongoose.Types.ObjectId(userId) }
      ]
    });

    res.json({
      status: 'success',
      data: {
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

/**
 * Process Google Pay transaction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
  getPaymentSummary,
  getGroupSettlement,
  addPaymentReminder,
  getUserPaymentHistory,
  processGooglePayTransaction,
  refundGooglePayTransaction,
  createPaymentIntent
};