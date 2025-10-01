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
  getSplitBillById,
  getGroupSplitBills,
  getSplitBillStats
};