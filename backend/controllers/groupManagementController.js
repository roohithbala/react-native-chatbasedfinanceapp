const Group = require('../models/Group');
const User = require('../models/User');
const {
  generateInviteCode,
  validateGroupMembership,
  validateGroupSettings
} = require('../utils/groupUtils');

/**
 * Get user groups
 * @param {string} userId - User ID
 * @returns {Array} - User's groups
 */
const getUserGroups = async (userId) => {
  let groups = await Group.find({
    'members.userId': userId,
    isActive: true
  })
  .populate('members.userId', 'name username email avatar')
  .sort('-createdAt');

  // If user has no groups, create default Personal group
  if (groups.length === 0) {
    const defaultGroup = {
      name: 'Personal',
      description: 'Your personal expenses and finances',
      inviteCode: generateInviteCode(),
      members: [{
        userId: userId,
        role: 'admin'
      }]
    };

    const createdGroup = await Group.create(defaultGroup);
    await createdGroup.populate('members.userId', 'name username email avatar');
    groups = [createdGroup];
  }

  return groups;
};

/**
 * Create group
 * @param {Object} groupData - Group data
 * @param {string} userId - User ID creating the group
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Created group
 */
const createGroup = async (groupData, userId, io) => {
  const inviteCode = generateInviteCode();

  const group = new Group({
    ...groupData,
    inviteCode,
    members: [{
      userId: userId,
      role: 'admin'
    }]
  });

  await group.save();
  await group.populate('members.userId', 'name username email avatar');

  // Emit real-time update to the user who created the group
  if (io) {
    io.to(`user_${userId}`).emit('groupUpdate', {
      type: 'created',
      group: group
    });
  }

  return group;
};

/**
 * Get group details
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID requesting details
 * @returns {Object} - Group details
 */
const getGroupDetails = async (groupId, userId) => {
  const group = await validateGroupMembership(groupId, userId);

  await group.populate('members.userId', 'name username email avatar');

  return {
    _id: group._id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    members: group.members,
    settings: group.settings,
    notifications: group.notifications,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  };
};

/**
 * Update group information
 * @param {string} groupId - Group ID
 * @param {Object} updates - Updates to apply
 * @param {string} userId - User ID making the update
 * @returns {Object} - Updated group
 */
const updateGroupInfo = async (groupId, updates, userId) => {
  const group = await validateGroupMembership(groupId, userId);

  // Check if user is admin - handle both populated and non-populated userId
  const member = group.members.find(m => {
    const memberUserId = m.userId._id || m.userId;
    return memberUserId.toString() === userId.toString();
  });
  
  if (!member || member.role !== 'admin') {
    throw new Error('Only group admins can update group information');
  }

  // Update allowed fields
  const allowedUpdates = ['name', 'description'];
  const updateData = {};

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid updates provided');
  }

  Object.assign(group, updateData);
  await group.save();

  await group.populate('members.userId', 'name username email avatar');

  return group;
};

/**
 * Update group settings
 * @param {string} groupId - Group ID
 * @param {Object} settings - New settings
 * @param {string} userId - User ID making the update
 * @returns {Object} - Updated group
 */
const updateGroupSettings = async (groupId, settings, userId) => {
  const group = await validateGroupMembership(groupId, userId);

  // Check if user is admin - handle both populated and non-populated userId
  const member = group.members.find(m => {
    const memberUserId = m.userId._id || m.userId;
    return memberUserId.toString() === userId.toString();
  });
  
  console.log('Admin check:', {
    userId: userId.toString(),
    memberFound: !!member,
    memberRole: member?.role,
    isAdmin: member?.role === 'admin',
    allMembers: group.members.map(m => ({
      userId: (m.userId._id || m.userId).toString(),
      role: m.role
    }))
  });
  
  if (!member || member.role !== 'admin') {
    throw new Error('Only group admins can update group settings');
  }

  // Validate settings
  validateGroupSettings(settings);

  group.settings = { ...group.settings, ...settings };
  await group.save();

  await group.populate('members.userId', 'name username email avatar');

  return group;
};

/**
 * Update notification settings
 * @param {string} groupId - Group ID
 * @param {Object} notifications - Notification settings
 * @param {string} userId - User ID making the update
 * @returns {Object} - Updated group
 */
const updateNotificationSettings = async (groupId, notifications, userId) => {
  const group = await validateGroupMembership(groupId, userId);

  group.notifications = { ...group.notifications, ...notifications };
  await group.save();

  await group.populate('members.userId', 'name username email avatar');

  return group;
};

/**
 * Get group statistics
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID requesting stats
 * @returns {Object} - Group statistics
 */
const getGroupStats = async (groupId, userId) => {
  const group = await validateGroupMembership(groupId, userId);

  // Populate member details for stats
  await group.populate('members.userId', 'name username email avatar');

  const Expense = require('../models/Expense');
  const SplitBill = require('../models/SplitBill');

  // Get expense statistics
  const expenses = await Expense.find({ groupId, isActive: true });
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCount = expenses.length;

  // Get split bill statistics
  const splitBills = await SplitBill.find({ groupId });
  const totalSplitBills = splitBills.length;
  const settledSplitBills = splitBills.filter(bill => bill.isSettled).length;
  const pendingSplitBills = totalSplitBills - settledSplitBills;

  // Group expenses by category
  const categoryMap = new Map();
  expenses.forEach(expense => {
    const category = expense.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { category, amount: 0, count: 0 });
    }
    const categoryData = categoryMap.get(category);
    categoryData.amount += expense.amount;
    categoryData.count += 1;
  });

  // Group by participant (from split bills)
  const participantMap = new Map();
  splitBills.forEach(bill => {
    if (bill.participants && Array.isArray(bill.participants)) {
      bill.participants.forEach(participant => {
        let userId = 'Unknown';
        let userName = 'Unknown';

        if (participant.userId) {
          if (typeof participant.userId === 'string') {
            userId = participant.userId;
            userName = 'Unknown User';
          } else if (participant.userId._id) {
            userId = participant.userId._id.toString();
            userName = participant.userId.name || 'Unknown User';
          }
        }

        if (!participantMap.has(userId)) {
          participantMap.set(userId, {
            userId,
            name: userName,
            totalAmount: 0,
            billCount: 0
          });
        }
        const participantData = participantMap.get(userId);
        participantData.totalAmount += participant.amount || 0;
        participantData.billCount += 1;
      });
    }
  });

  return {
    overview: {
      totalAmount: totalExpenses,
      count: expenseCount,
      settled: settledSplitBills,
      pending: pendingSplitBills
    },
    byCategory: Array.from(categoryMap.values()),
    byParticipant: Array.from(participantMap.values())
  };
};

module.exports = {
  getUserGroups,
  createGroup,
  getGroupDetails,
  updateGroupInfo,
  updateGroupSettings,
  updateNotificationSettings,
  getGroupStats
};