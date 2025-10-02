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
 * Mark current user as paid in a split bill
 */
async function markCurrentUserAsPaid(req, res) {
  try {
    const { splitBillId } = req.params;
    const { paymentMethod = 'cash', notes } = req.body;

    if (!isValidObjectId(splitBillId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid split bill ID'
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

    // Check if user is authorized to view this split bill
    if (!isAuthorizedForSplitBill(splitBill, req.userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this split bill'
      });
    }

    // Check if user is a participant in this bill
    const participant = splitBill.participants.find(p =>
      p.userId.toString() === req.userId.toString()
    );

    if (!participant) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this bill'
      });
    }

    if (participant.isPaid) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already marked this payment as paid'
      });
    }

    // Mark the current user as paid
    await splitBill.markParticipantAsPaid(req.userId, paymentMethod, notes);

    // Emit real-time update
    emitSplitBillUpdate(req.io, splitBill, req.userId, paymentMethod, req.userId);

    res.json({
      status: 'success',
      message: 'Payment marked as paid successfully',
      data: {
        splitBill: buildSplitBillResponse(splitBill)
      }
    });
  } catch (error) {
    console.error('Mark current user as paid error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
}

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
 * Process BHIM UPI transaction
 */
async function processBhimUpiTransaction(req, res) {
  try {
    const {
      upiId,
      amount,
      currency,
      description,
      recipientId,
      splitBillId,
      groupId,
      merchantCode = 'BCR2DN6TZ6S6BHXV' // Default BHIM merchant code
    } = req.body;

    // Validate required fields
    if (!upiId || !amount || !currency) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required payment data: upiId, amount, and currency are required'
      });
    }

    // Validate UPI ID format
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiRegex.test(upiId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid UPI ID format'
      });
    }

    // Generate UPI transaction ID
    const transactionId = `BHIM${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create UPI payment string for QR code generation
    const upiPaymentString = `upi://pay?pa=${upiId}&pn=ChatFinance&am=${amount}&cu=${currency}&tn=${encodeURIComponent(description || 'Split bill payment')}&mc=${merchantCode}&tid=${transactionId}`;

    // Generate QR code data URL (in production, use a QR code library)
    const qrCodeData = `data:image/png;base64,${Buffer.from(upiPaymentString).toString('base64')}`;

    // If this is for a split bill, mark the participant as paid
    if (splitBillId && recipientId) {
      const splitBill = await SplitBill.findById(splitBillId);
      if (splitBill) {
        await splitBill.markParticipantAsPaid(recipientId, 'bhim_upi', `BHIM UPI transaction: ${transactionId}`);
      }
    }

    // Log the transaction
    console.log('BHIM UPI transaction initiated:', {
      transactionId,
      upiId,
      amount,
      currency,
      description,
      recipientId,
      splitBillId,
      groupId,
      userId: req.userId,
      upiPaymentString
    });

    res.json({
      status: 'success',
      message: 'BHIM UPI payment initiated successfully',
      data: {
        transactionId,
        upiId,
        amount,
        currency,
        description,
        upiPaymentString,
        qrCodeData,
        paymentStatus: 'initiated',
        initiatedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
      }
    });
  } catch (error) {
    console.error('BHIM UPI transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Payment processing failed'
    });
  }
}

/**
 * Refund BHIM UPI transaction
 */
async function refundBhimUpiTransaction(req, res) {
  try {
    const { transactionId, amount, reason } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction ID is required'
      });
    }

    // In BHIM UPI, refunds are typically handled through the payment gateway
    // For now, we'll simulate a successful refund
    const refundId = `BHIM_REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Log the refund
    console.log('BHIM UPI refund processed:', {
      refundId,
      originalTransactionId: transactionId,
      amount,
      reason,
      userId: req.userId,
    });

    res.json({
      status: 'success',
      message: 'BHIM UPI refund processed successfully',
      data: {
        refundId,
        originalTransactionId: transactionId,
        amount,
        reason,
        processedAt: new Date(),
      }
    });
  } catch (error) {
    console.error('BHIM UPI refund error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Refund processing failed'
    });
  }
}

/**
 * Create BHIM UPI payment intent
 */
async function createBhimUpiPaymentIntent(req, res) {
  try {
    const {
      amount,
      currency,
      description,
      recipientId,
      splitBillId,
      groupId,
      upiId,
      merchantCode = 'BCR2DN6TZ6S6BHXV' // Default BHIM merchant code
    } = req.body;

    // Validate required fields
    if (!amount || !currency || !upiId) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount, currency, and UPI ID are required'
      });
    }

    // Validate UPI ID format
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiRegex.test(upiId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid UPI ID format'
      });
    }

    // Generate payment intent ID and transaction ID
    const paymentIntentId = `BHIM_PI_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const transactionId = `BHIM${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create UPI payment string
    const upiPaymentString = `upi://pay?pa=${upiId}&pn=ChatFinance&am=${amount}&cu=${currency}&tn=${encodeURIComponent(description || 'Split bill payment')}&mc=${merchantCode}&tid=${transactionId}`;

    // Generate QR code data (simplified - in production use proper QR library)
    const qrCodeData = `data:image/png;base64,${Buffer.from(upiPaymentString).toString('base64')}`;

    // Log the payment intent creation
    console.log('BHIM UPI payment intent created:', {
      paymentIntentId,
      transactionId,
      amount,
      currency,
      description,
      recipientId,
      splitBillId,
      groupId,
      upiId,
      userId: req.userId,
      upiPaymentString
    });

    res.json({
      status: 'success',
      message: 'BHIM UPI payment intent created successfully',
      data: {
        paymentIntentId,
        transactionId,
        upiId,
        amount,
        currency,
        description,
        upiPaymentString,
        qrCodeData,
        merchantCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
        createdAt: new Date(),
      }
    });
  } catch (error) {
    console.error('Create BHIM UPI payment intent error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Payment intent creation failed'
    });
  }
}

/**
 * Verify BHIM UPI payment status
 */
async function verifyBhimUpiPayment(req, res) {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction ID is required'
      });
    }

    // In a real implementation, you would check with the UPI gateway
    // For now, we'll simulate payment verification
    const paymentStatus = Math.random() > 0.3 ? 'completed' : 'pending'; // 70% success rate for demo

    console.log('BHIM UPI payment verification:', {
      transactionId,
      status: paymentStatus,
      verifiedAt: new Date(),
      userId: req.userId,
    });

    res.json({
      status: 'success',
      message: 'Payment verification completed',
      data: {
        transactionId,
        paymentStatus,
        verifiedAt: new Date(),
      }
    });
  } catch (error) {
    console.error('BHIM UPI payment verification error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Payment verification failed'
    });
  }
}

/**
 * Generate UPI QR Code for payment
 */
async function generateUpiQrCode(req, res) {
  try {
    const {
      amount,
      currency = 'INR',
      description,
      upiId,
      merchantCode = 'BCR2DN6TZ6S6BHXV'
    } = req.body;

    if (!amount || !upiId) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount and UPI ID are required'
      });
    }

    // Validate UPI ID format
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiRegex.test(upiId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid UPI ID format'
      });
    }

    const transactionId = `BHIM_QR_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create UPI payment string for QR code
    const upiPaymentString = `upi://pay?pa=${upiId}&pn=ChatFinance&am=${amount}&cu=${currency}&tn=${encodeURIComponent(description || 'Payment')}&mc=${merchantCode}&tid=${transactionId}`;

    // In production, use a proper QR code generation library
    // For now, return the UPI string that can be used to generate QR code on frontend
    const qrCodeData = {
      upiString: upiPaymentString,
      transactionId,
      amount,
      currency,
      upiId,
      description,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    console.log('UPI QR Code generated:', qrCodeData);

    res.json({
      status: 'success',
      message: 'UPI QR Code generated successfully',
      data: qrCodeData
    });
  } catch (error) {
    console.error('UPI QR Code generation error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'QR Code generation failed'
    });
  }
}

module.exports = {
  markCurrentUserAsPaid,
  markParticipantAsPaid,
  confirmPayment,
  processBhimUpiTransaction,
  refundBhimUpiTransaction,
  createBhimUpiPaymentIntent,
  verifyBhimUpiPayment,
  generateUpiQrCode
};