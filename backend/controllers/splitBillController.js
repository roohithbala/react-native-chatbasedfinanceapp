const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const Group = require('../models/Group');
const splitBillUtils = require('../utils/splitBillUtils');

/**
 * Get split bills for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Object} - Split bills data with pagination
 */
const getUserSplitBills = async (userId, filters = {}) => {
  const { page = 1, limit = 20 } = filters;

  const query = splitBillUtils.buildSplitBillQuery(userId, filters);

  const splitBills = await SplitBill.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'name avatar')
    .populate('participants.userId', 'name avatar')
    .populate({
      path: 'groupId',
      select: 'name',
      options: { allowEmpty: true }
    });

  const total = await SplitBill.countDocuments(query);

  return {
    splitBills,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total
  };
};

/**
 * Create a new split bill
 * @param {string} userId - Creator user ID
 * @param {Object} splitBillData - Split bill data
 * @returns {Object} - Created split bill
 */
const createSplitBill = async (userId, splitBillData) => {
  const {
    description,
    totalAmount,
    groupId,
    participants,
    splitType,
    category,
    currency = 'INR',
    notes
  } = splitBillData;

  // Basic validation
  const validation = splitBillUtils.validateSplitBillData(splitBillData);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  // Validate participants and amounts
  const amountValidation = splitBillUtils.validateParticipantAmounts(participants, totalAmount);
  if (!amountValidation.isValid) {
    throw new Error(amountValidation.message);
  }

  let isGroupSplitBill = false;
  let validatedGroup = null;

  // Validate group or direct split bill
  if (groupId && groupId !== 'undefined' && groupId !== 'null' && groupId !== '') {
    const groupValidation = await splitBillUtils.validateGroupSplitBill(groupId, participants, userId);
    if (!groupValidation.isValid) {
      throw new Error(groupValidation.message);
    }
    isGroupSplitBill = true;
    validatedGroup = groupValidation.group;
  } else {
    const directValidation = await splitBillUtils.validateDirectSplitBill(participants, userId);
    if (!directValidation.isValid) {
      throw new Error(directValidation.message);
    }
  }

  // Create the split bill
  const splitBill = new SplitBill({
    description,
    totalAmount,
    groupId: isGroupSplitBill ? new mongoose.Types.ObjectId(groupId) : null,
    participants: participants.map(p => ({
      userId: new mongoose.Types.ObjectId(p.userId),
      amount: p.amount,
      isPaid: p.userId === userId.toString() // Creator has paid their share
    })),
    splitType: splitType || 'equal',
    category: category || 'Other',
    currency,
    notes,
    createdBy: userId
  });

  await splitBill.save();

  // Populate the response
  await splitBill
    .populate('createdBy', 'name avatar')
    .populate('participants.userId', 'name avatar')
    .populate({
      path: 'groupId',
      select: 'name',
      options: { allowEmpty: true }
    });

  return splitBill;
};

/**
 * Get split bill by ID
 * @param {string} splitBillId - Split bill ID
 * @param {string} userId - User ID requesting the split bill
 * @returns {Object} - Split bill data
 */
const getSplitBillById = async (splitBillId, userId) => {
  const splitBill = await SplitBill.findById(splitBillId)
    .populate('createdBy', 'name avatar')
    .populate('participants.userId', 'name avatar')
    .populate({
      path: 'groupId',
      select: 'name',
      options: { allowEmpty: true }
    });

  if (!splitBill) {
    throw new Error('Split bill not found');
  }

  // Check if user is involved in the split bill
  if (!splitBillUtils.isUserInvolvedInSplitBill(splitBill, userId)) {
    throw new Error('Access denied');
  }

  return splitBill;
};

/**
 * Mark a payment as paid
 * @param {string} splitBillId - Split bill ID
 * @param {string} userId - User ID marking payment as paid
 * @returns {Object} - Updated split bill
 */
const markPaymentAsPaid = async (splitBillId, userId) => {
  const splitBill = await SplitBill.findById(splitBillId);

  if (!splitBill) {
    throw new Error('Split bill not found');
  }

  const participant = splitBill.participants.find(
    p => p.userId.toString() === userId
  );

  if (!participant) {
    throw new Error('You are not a participant in this bill');
  }

  if (participant.isPaid) {
    throw new Error('Payment already marked as paid');
  }

  participant.isPaid = true;
  participant.paidAt = new Date();

  // Check if all participants have paid
  const allPaid = splitBill.participants.every(p => p.isPaid);
  if (allPaid) {
    splitBill.isSettled = true;
    splitBill.settledAt = new Date();
  }

  await splitBill.save();

  // Populate the response
  await splitBill
    .populate('createdBy', 'name avatar')
    .populate('participants.userId', 'name avatar')
    .populate({
      path: 'groupId',
      select: 'name',
      options: { allowEmpty: true }
    });

  return splitBill;
};

/**
 * Get split bills for a specific group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID requesting the data
 * @param {Object} pagination - Pagination options
 * @returns {Object} - Group split bills data
 */
const getGroupSplitBills = async (groupId, userId, pagination = {}) => {
  const { page = 1, limit = 20 } = pagination;

  // Verify group membership
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  if (!group.members.some(m => m.userId.toString() === userId && m.isActive)) {
    throw new Error('Access denied');
  }

  const splitBills = await SplitBill.find({ groupId })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'name avatar')
    .populate('participants.userId', 'name avatar');

  const total = await SplitBill.countDocuments({ groupId });

  return {
    splitBills,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total
  };
};

/**
 * Get split bill statistics
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Object} - Statistics data
 */
const getSplitBillStats = async (userId, filters = {}) => {
  const query = splitBillUtils.buildStatsQuery(userId, filters);

  const stats = await SplitBill.aggregate([
    { $match: query },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$totalAmount' },
              count: { $sum: 1 },
              settled: {
                $sum: { $cond: ['$isSettled', 1, 0] }
              },
              pending: {
                $sum: { $cond: ['$isSettled', 0, 1] }
              }
            }
          }
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              amount: { $sum: '$totalAmount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { amount: -1 } }
        ],
        byGroup: [
          {
            $group: {
              _id: '$groupId',
              amount: { $sum: '$totalAmount' },
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'groups',
              localField: '_id',
              foreignField: '_id',
              as: 'groupDetails'
            }
          },
          {
            $project: {
              amount: 1,
              count: 1,
              groupName: { $arrayElemAt: ['$groupDetails.name', 0] }
            }
          }
        ]
      }
    }
  ]);

  return stats[0];
};

module.exports = {
  getUserSplitBills,
  createSplitBill,
  getSplitBillById,
  markPaymentAsPaid,
  getGroupSplitBills,
  getSplitBillStats
};