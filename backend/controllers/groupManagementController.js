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

  // Emit real-time update
  if (io) {
    io.emit('group-update', {
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

  // Check if user is admin
  const member = group.members.find(m => m.userId.toString() === userId);
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

  // Check if user is admin
  const member = group.members.find(m => m.userId.toString() === userId);
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

  const Expense = require('../models/Expense');
  const SplitBill = require('../models/SplitBill');

  // Get expense statistics
  const expenses = await Expense.find({ groupId, isActive: true });
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCount = expenses.length;

  // Get split bill statistics
  const splitBills = await SplitBill.find({ 'participants.groupId': groupId });
  const totalSplitBills = splitBills.length;
  const settledSplitBills = splitBills.filter(bill => bill.isSettled).length;

  // Calculate member contributions
  const memberStats = {};
  group.members.forEach(member => {
    const memberId = member.userId.toString();
    const memberExpenses = expenses.filter(exp => exp.userId.toString() === memberId);
    const totalSpent = memberExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    memberStats[memberId] = {
      name: member.userId.name || 'Unknown',
      totalSpent,
      expenseCount: memberExpenses.length
    };
  });

  return {
    totalExpenses,
    expenseCount,
    totalSplitBills,
    settledSplitBills,
    pendingSplitBills: totalSplitBills - settledSplitBills,
    memberCount: group.members.length,
    memberStats
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