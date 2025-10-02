const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const Group = require('../models/Group');

/**
 * Validates MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Validates payment input data
 * @param {Object} data - Payment data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validatePaymentData(data) {
  const errors = [];

  if (!data.splitBillId || !isValidObjectId(data.splitBillId)) {
    errors.push('Valid split bill ID is required');
  }

  if (!data.participantId || !isValidObjectId(data.participantId)) {
    errors.push('Valid participant ID is required');
  }

  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates payment confirmation data
 * @param {Object} data - Payment confirmation data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validatePaymentConfirmationData(data) {
  const errors = [];

  if (!data.splitBillId || !isValidObjectId(data.splitBillId)) {
    errors.push('Valid split bill ID is required');
  }

  if (!data.paymentId || !isValidObjectId(data.paymentId)) {
    errors.push('Valid payment ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates reminder data
 * @param {Object} data - Reminder data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validateReminderData(data) {
  const errors = [];

  if (!data.splitBillId || !isValidObjectId(data.splitBillId)) {
    errors.push('Valid split bill ID is required');
  }

  if (!data.userId || !isValidObjectId(data.userId)) {
    errors.push('Valid user ID is required');
  }

  if (!data.type) {
    errors.push('Reminder type is required');
  }

  if (!data.message) {
    errors.push('Reminder message is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if user is authorized to access a split bill
 * @param {Object} splitBill - Split bill document
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if authorized
 */
function isAuthorizedForSplitBill(splitBill, userId) {
  // Creator always has access to their own split bills
  if (splitBill.createdBy.toString() === userId.toString()) {
    return true;
  }

  // Check if user is a participant
  if (splitBill.participants && splitBill.participants.length > 0) {
    return splitBill.participants.some(p => {
      // Handle both populated objects and ObjectId strings
      const participantUserId = typeof p.userId === 'object' && p.userId ? p.userId._id || p.userId : p.userId;
      const participantIdString = participantUserId ? participantUserId.toString() : '';
      return participantIdString === userId.toString();
    });
  }

  return false;
}

/**
 * Checks if user is authorized to send reminders for a split bill
 * @param {Object} splitBill - Split bill document
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if authorized
 */
function isAuthorizedToSendReminders(splitBill, userId) {
  return splitBill.createdBy.toString() === userId;
}

/**
 * Checks if user is a member of a group
 * @param {Object} group - Group document
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if member
 */
function isGroupMember(group, userId) {
  return group.members.some(member =>
    member.userId.toString() === userId.toString() && member.isActive
  );
}

/**
 * Builds query for user's payment history
 * @param {string} userId - User ID
 * @returns {Object} - MongoDB aggregation pipeline
 */
function buildPaymentHistoryQuery(userId) {
  return [
    {
      $match: {
        $or: [
          { createdBy: mongoose.Types.ObjectId(userId) },
          { 'participants.userId': mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'creator'
      }
    },
    {
      $lookup: {
        from: 'groups',
        localField: 'groupId',
        foreignField: '_id',
        as: 'group'
      }
    },
    {
      $project: {
        description: 1,
        totalAmount: 1,
        createdAt: 1,
        isSettled: 1,
        category: 1,
        payments: {
          $filter: {
            input: '$payments',
            as: 'payment',
            cond: {
              $or: [
                { $eq: ['$$payment.fromUserId', mongoose.Types.ObjectId(userId)] },
                { $eq: ['$$payment.toUserId', mongoose.Types.ObjectId(userId)] }
              ]
            }
          }
        },
        participants: {
          $filter: {
            input: '$participants',
            as: 'participant',
            cond: { $eq: ['$$participant.userId', mongoose.Types.ObjectId(userId)] }
          }
        },
        creator: { $arrayElemAt: ['$creator', 0] },
        group: { $arrayElemAt: ['$group', 0] }
      }
    },
    { $sort: { createdAt: -1 } }
  ];
}

/**
 * Builds pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} - Pagination parameters
 */
function buildPaginationParams(query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Emits real-time split bill update via Socket.io
 * @param {Object} io - Socket.io instance
 * @param {Object} splitBill - Split bill document
 * @param {string} participantId - Participant ID
 * @param {string} paymentMethod - Payment method
 * @param {string} updatedBy - User who made the update
 */
function emitSplitBillUpdate(io, splitBill, participantId, paymentMethod, updatedBy) {
  if (io && splitBill.groupId) {
    io.to(splitBill.groupId.toString()).emit('split-bill-updated', {
      type: 'payment-made',
      splitBillId: splitBill._id,
      participantId: participantId,
      paymentMethod: paymentMethod,
      updatedBy: updatedBy,
      splitBill: {
        _id: splitBill._id,
        description: splitBill.description,
        totalAmount: splitBill.totalAmount,
        isSettled: splitBill.isSettled,
        participants: splitBill.participants,
        payments: splitBill.payments
      }
    });
  }
}

/**
 * Builds simplified split bill response object
 * @param {Object} splitBill - Split bill document
 * @returns {Object} - Simplified split bill object
 */
function buildSplitBillResponse(splitBill) {
  return {
    _id: splitBill._id,
    description: splitBill.description,
    totalAmount: splitBill.totalAmount,
    isSettled: splitBill.isSettled,
    participants: splitBill.participants,
    payments: splitBill.payments
  };
}

/**
 * Builds detailed split bill response object
 * @param {Object} splitBill - Split bill document
 * @returns {Object} - Detailed split bill object
 */
function buildDetailedSplitBillResponse(splitBill) {
  return {
    _id: splitBill._id,
    description: splitBill.description,
    totalAmount: splitBill.totalAmount,
    createdBy: splitBill.createdBy,
    participants: splitBill.participants,
    payments: splitBill.payments,
    isSettled: splitBill.isSettled,
    createdAt: splitBill.createdAt
  };
}

module.exports = {
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
};