/**
 * Builds query for split bills based on filters
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Object} - MongoDB query object
 */
const buildSplitBillQuery = (userId, filters = {}) => {
  const { groupId, status } = filters;

  const query = {
    $or: [
      { createdBy: userId },
      { 'participants.userId': userId }
    ]
  };

  if (groupId) {
    query.groupId = groupId;
  } else if (groupId === null) {
    // Explicitly filter for direct chat split bills (no groupId)
    query.groupId = { $exists: false };
  }

  if (status === 'pending') {
    query['participants'] = {
      $elemMatch: {
        userId: userId,
        isPaid: false
      }
    };
  } else if (status === 'paid') {
    query['participants'] = {
      $elemMatch: {
        userId: userId,
        isPaid: true
      }
    };
  }

  return query;
};

/**
 * Builds query for split bill statistics
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Object} - MongoDB query object
 */
const buildStatsQuery = (userId, filters = {}) => {
  const { groupId, period = 'month' } = filters;

  let startDate = new Date();
  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  const query = {
    $or: [
      { createdBy: userId },
      { 'participants.userId': userId }
    ],
    createdAt: { $gte: startDate }
  };

  if (groupId) {
    query.groupId = groupId;
  }

  return query;
};

/**
 * Checks if user is involved in a split bill
 * @param {Object} splitBill - Split bill document
 * @param {string} userId - User ID
 * @returns {boolean} - Whether user is involved
 */
const isUserInvolvedInSplitBill = (splitBill, userId) => {
  return splitBill.createdBy._id.toString() === userId ||
    splitBill.participants.some(p => p.userId._id.toString() === userId);
};

module.exports = {
  buildSplitBillQuery,
  buildStatsQuery,
  isUserInvolvedInSplitBill
};