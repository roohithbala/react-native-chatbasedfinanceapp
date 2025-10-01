const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const {
  buildPaymentHistoryQuery,
  buildPaginationParams
} = require('../utils/paymentUtils');

/**
 * Get user's payment history
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

module.exports = {
  getUserPaymentHistory
};