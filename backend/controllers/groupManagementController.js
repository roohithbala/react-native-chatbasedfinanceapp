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
const getGroupStats = async (groupId, userId, period = 'month') => {
  console.log(`\n🔍 getGroupStats called for groupId: ${groupId}, userId: ${userId}, period: ${period}`);
  
  try {
    const group = await validateGroupMembership(groupId, userId);
    console.log(`✅ Group validated: ${group.name || 'Unnamed Group'}`);

    // Populate member details for stats
    await group.populate('members.userId', 'name username email avatar');
    console.log(`👥 Group has ${group.members?.length || 0} members`);

    const Expense = require('../models/Expense');
    const SplitBill = require('../models/SplitBill');

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1); // Default to month
    }
    
    console.log(`📅 Filtering data from ${startDate.toISOString()} to ${now.toISOString()}`);

    // Get expense statistics with date filter
    const expenses = await Expense.find({ 
      groupId, 
      isActive: true,
      createdAt: { $gte: startDate, $lte: now }
    });
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;
    console.log(`💰 Found ${expenseCount} expenses in ${period}, total: ₹${totalExpenses}`);

  // Get split bill statistics with populated participant details and date filter
  let splitBills = [];
  try {
    splitBills = await SplitBill.find({ 
      groupId,
      createdAt: { $gte: startDate, $lte: now }
    })
      .populate('participants.userId', 'name username email avatar')
      .populate('createdBy', 'name username avatar')
      .lean();
    console.log(`📋 Found ${splitBills.length} split bills in ${period}`);
  } catch (populateError) {
    console.error('❌ Error populating split bills, fetching without populate:', populateError.message);
    // Fallback: fetch without populate but still filter by date
    splitBills = await SplitBill.find({ 
      groupId,
      createdAt: { $gte: startDate, $lte: now }
    }).lean();
  }
  
  const totalSplitBills = splitBills.length;
  const settledSplitBills = splitBills.filter(bill => bill.isSettled).length;
  const pendingSplitBills = totalSplitBills - settledSplitBills;
  console.log(`📊 Split bills: ${totalSplitBills} total, ${settledSplitBills} settled, ${pendingSplitBills} pending`);
  
  // Calculate total amount from split bills
  const totalSplitBillAmount = splitBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  console.log(`💵 Split bills total amount: ₹${totalSplitBillAmount}`);
  
  // Combined totals
  const combinedTotalAmount = totalExpenses + totalSplitBillAmount;
  const combinedCount = expenseCount + totalSplitBills;
  console.log(`📊 OVERVIEW STATS: Total Amount: ₹${combinedTotalAmount}, Count: ${combinedCount}, Settled: ${settledSplitBills}, Pending: ${pendingSplitBills}`);

  // Group expenses by category (including split bills)
  const categoryMap = new Map();
  console.log(`📊 Processing ${expenses.length} expenses for category stats`);
  
  expenses.forEach(expense => {
    const category = expense.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { category, amount: 0, count: 0 });
    }
    const categoryData = categoryMap.get(category);
    categoryData.amount += expense.amount;
    categoryData.count += 1;
  });
  
  // Add split bills to category breakdown
  console.log(`📊 Adding ${splitBills.length} split bills to category stats`);
  splitBills.forEach(bill => {
    const category = bill.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { category, amount: 0, count: 0 });
    }
    const categoryData = categoryMap.get(category);
    categoryData.amount += bill.totalAmount || 0;
    categoryData.count += 1;
    console.log(`  Split bill: ${category} - ₹${bill.totalAmount || 0}`);
  });
  
  console.log(`📈 Final category stats:`, Array.from(categoryMap.values()));

  // Group by participant (from split bills)
  const participantMap = new Map();
  console.log(`📊 Processing ${splitBills.length} split bills for participant stats`);
  
  splitBills.forEach((bill, index) => {
    if (bill.participants && Array.isArray(bill.participants)) {
      console.log(`Bill ${index + 1}: ${bill.participants.length} participants`);
      
      bill.participants.forEach((participant, pIndex) => {
        let userId = 'Unknown';
        let userName = 'Unknown';

        if (participant.userId) {
          if (typeof participant.userId === 'string') {
            userId = participant.userId;
            userName = 'Unknown User';
          } else if (participant.userId._id) {
            userId = participant.userId._id.toString();
            userName = participant.userId.name || participant.userId.username || 'Unknown User';
          } else if (participant.userId.name) {
            // Populated user object
            userId = participant.userId._id ? participant.userId._id.toString() : 'Unknown';
            userName = participant.userId.name;
          }
        }

        console.log(`  Participant ${pIndex + 1}: ${userName} (${userId}) - Amount: ₹${participant.amount || 0}`);

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
    } else {
      console.log(`Bill ${index + 1}: No participants found`);
    }
  });
  
  console.log(`📈 Final participant stats:`, Array.from(participantMap.values()));

  const result = {
    overview: {
      totalAmount: combinedTotalAmount,
      count: combinedCount,
      settled: settledSplitBills,
      pending: pendingSplitBills,
      expensesOnly: totalExpenses,
      splitBillsOnly: totalSplitBillAmount
    },
    byCategory: Array.from(categoryMap.values()),
    byParticipant: Array.from(participantMap.values())
  };
  
    console.log(`\n✅ Returning group stats:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Error in getGroupStats:', error);
    // Return safe defaults to prevent white screen
    return {
      overview: {
        totalAmount: 0,
        count: 0,
        settled: 0,
        pending: 0,
        expensesOnly: 0,
        splitBillsOnly: 0
      },
      byCategory: [],
      byParticipant: []
    };
  }
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