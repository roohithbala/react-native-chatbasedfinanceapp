const Group = require('../models/Group');
const User = require('../models/User');
const SplitBill = require('../models/SplitBill');
const {
  generateInviteCode,
  validateGroupMembership,
  canAddMemberToGroup,
  calculateSplitParticipants,
  validateGroupSettings
} = require('../utils/groupUtils');

// Get user groups
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

// Create group
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

// Join group with invite code
const joinGroup = async (inviteCode, userId) => {
  const group = await Group.findOne({
    inviteCode,
    isActive: true,
    'settings.allowInvites': true
  });

  if (!group) {
    throw new Error('Invalid or expired invite code');
  }

  // Check if user is already a member
  const isMember = group.members.some(m => m.userId.toString() === userId && m.isActive);
  if (isMember) {
    throw new Error('Already a member of this group');
  }

  // Add user to group
  group.members.push({
    userId: userId,
    role: 'member'
  });

  await group.save();

  // Add group to user's groups
  const user = await User.findById(userId);
  if (user && user.groups) {
    user.groups.push(group._id);
    await user.save();
  }

  await group.populate('members.userId', 'name email avatar');

  return group;
};

// Get group details
const getGroupDetails = async (groupId, userId) => {
  const group = await Group.findOne({
    _id: groupId,
    'members.userId': userId,
    isActive: true
  }).populate('members.userId', 'name email avatar');

  if (!group) {
    throw new Error('Group not found');
  }

  // Get group expenses and split bills
  const splitBills = await SplitBill.find({ groupId: group._id })
    .populate('createdBy', 'name avatar')
    .populate('participants.userId', 'name avatar')
    .sort({ createdAt: -1 });

  return { group, splitBills };
};

// Add member to group
const addMemberToGroup = async (groupId, searchField, searchValue, userId, io) => {
  const group = await Group.findOne({
    _id: groupId,
    'members.userId': userId,
    'members.role': 'admin'
  });

  if (!group) {
    throw new Error('Group not found or insufficient permissions');
  }

  const canAdd = canAddMemberToGroup(group, null); // We'll check user existence next
  if (!canAdd.canAdd) {
    throw new Error(canAdd.error);
  }

  const user = await User.findOne({ [searchField]: searchValue });
  if (!user) {
    throw new Error(`${searchField === 'email' ? 'User with this email' : 'User with this username'} not found`);
  }

  const userCanAdd = canAddMemberToGroup(group, user._id);
  if (!userCanAdd.canAdd) {
    throw new Error(userCanAdd.error);
  }

  // Add member
  group.members.push({
    userId: user._id,
    role: 'member'
  });

  await group.save();

  // Add group to user
  user.groups.push(group._id);
  await user.save();

  await group.populate('members.userId', 'name email avatar');

  // Emit real-time update
  if (io) {
    io.to(group._id.toString()).emit('group-update', {
      type: 'member-added',
      groupId: group._id.toString(),
      member: {
        userId: user._id,
        name: user.name,
        avatar: user.avatar
      }
    });
  }

  return group;
};

// Split bill
const splitBill = async (groupId, billData, userId) => {
  const { description, amount, participants, splitType = 'equal' } = billData;

  const validation = await validateGroupMembership(groupId, userId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Validate inputs
  if (!description || !amount || !Array.isArray(participants) || participants.length === 0) {
    throw new Error('Missing required fields: description, amount, and participants');
  }

  // Calculate splits
  const splitParticipants = calculateSplitParticipants(participants, amount, splitType);

  // Create the split bill
  const splitBill = new SplitBill({
    description: description.trim(),
    totalAmount: parseFloat(amount.toFixed(2)),
    currency: 'INR',
    createdBy: userId,
    groupId: groupId,
    participants: splitParticipants,
    splitType: splitType,
    category: 'Other',
    isSettled: false
  });

  await splitBill.save();
  await splitBill.populate('createdBy', 'name avatar');
  await splitBill.populate('participants.userId', 'name avatar');

  return splitBill;
};

// Generate new invite code
const generateNewInviteCode = async (groupId, userId) => {
  const validation = await validateGroupMembership(groupId, userId, 'admin');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const group = validation.group;
  group.inviteCode = generateInviteCode();
  await group.save();

  return group.inviteCode;
};

// Update member role
const updateMemberRole = async (groupId, memberId, role, userId, io) => {
  if (!['admin', 'member'].includes(role)) {
    throw new Error('Invalid role. Must be admin or member');
  }

  const group = await Group.findOne({
    _id: groupId,
    members: {
      $elemMatch: {
        userId: userId,
        role: 'admin',
        isActive: true
      }
    },
    isActive: true
  });

  if (!group) {
    throw new Error('Group not found or insufficient permissions');
  }

  // Find the member to update
  const memberIndex = group.members.findIndex(m =>
    m.userId.toString() === memberId && m.isActive
  );

  if (memberIndex === -1) {
    throw new Error('Member not found in group');
  }

  // Update member role
  group.members[memberIndex].role = role;
  await group.save();

  await group.populate('members.userId', 'name username email avatar');

  // Emit real-time update
  if (io) {
    io.to(group._id.toString()).emit('group-update', {
      type: 'member-role-updated',
      groupId: group._id.toString(),
      memberId: memberId,
      newRole: role
    });
  }

  return group;
};

// Remove member from group
const removeMemberFromGroup = async (groupId, memberId, userId, io) => {
  const group = await Group.findOne({
    _id: groupId,
    members: {
      $elemMatch: {
        userId: userId,
        role: 'admin',
        isActive: true
      }
    },
    isActive: true
  });

  if (!group) {
    throw new Error('Group not found or insufficient permissions');
  }

  // Check if trying to remove the last admin
  const memberToRemove = group.members.find(m => m.userId.toString() === memberId);
  const adminCount = group.members.filter(m => m.role === 'admin' && m.isActive).length;

  if (memberToRemove && memberToRemove.role === 'admin' && adminCount === 1) {
    throw new Error('Cannot remove the last admin from the group. Promote another member to admin first.');
  }

  // Find and deactivate the member
  const memberIndex = group.members.findIndex(m =>
    m.userId.toString() === memberId && m.isActive
  );

  if (memberIndex === -1) {
    throw new Error('Member not found in group');
  }

  // Deactivate member instead of removing completely
  group.members[memberIndex].isActive = false;
  await group.save();

  // Remove group from user's groups list
  await User.findByIdAndUpdate(memberId, {
    $pull: { groups: group._id }
  });

  await group.populate('members.userId', 'name username email avatar');

  // Emit real-time update
  if (io) {
    io.to(group._id.toString()).emit('group-update', {
      type: 'member-removed',
      groupId: group._id.toString(),
      memberId: memberId
    });
  }

  return group;
};

// Leave group
const leaveGroup = async (groupId, userId, io) => {
  const group = await Group.findOne({
    _id: groupId,
    'members.userId': userId,
    isActive: true
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Check if user is the only admin
  const adminCount = group.members.filter(m => m.role === 'admin' && m.isActive).length;
  const currentUserMember = group.members.find(m => m.userId.toString() === userId);

  if (currentUserMember && currentUserMember.role === 'admin' && adminCount === 1) {
    throw new Error('Cannot leave group as the last admin. Transfer admin role to another member first.');
  }

  // Deactivate member instead of removing completely
  const memberIndex = group.members.findIndex(m =>
    m.userId.toString() === userId && m.isActive
  );

  if (memberIndex !== -1) {
    group.members[memberIndex].isActive = false;
    await group.save();
  }

  // Remove group from user's groups list
  await User.findByIdAndUpdate(userId, {
    $pull: { groups: group._id }
  });

  // Emit real-time update
  if (io) {
    io.to(group._id.toString()).emit('group-update', {
      type: 'member-left',
      groupId: group._id.toString(),
      memberId: userId
    });
  }
};

// Update group information
const updateGroupInfo = async (groupId, updates, userId) => {
  const validation = await validateGroupMembership(groupId, userId, 'admin');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const group = validation.group;

  // Update basic information
  if (updates.name !== undefined) {
    group.name = updates.name.trim();
  }
  if (updates.description !== undefined) {
    group.description = updates.description.trim();
  }

  await group.save();
  return group;
};

// Update group settings
const updateGroupSettings = async (groupId, settings, userId) => {
  const validation = await validateGroupMembership(groupId, userId, 'admin');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const group = validation.group;

  // Validate settings
  validateGroupSettings(settings);

  // Ensure settings object exists
  if (!group.settings) {
    group.settings = {
      isPrivate: false,
      allowInvites: true,
      currency: 'INR',
      splitMethod: 'equal',
      notifications: {
        newMember: true,
        newExpense: true,
        paymentReminder: true,
        settlementDue: true
      }
    };
  }

  // Update only the fields that were provided
  if (settings.currency !== undefined) {
    group.settings.currency = settings.currency;
  }
  if (settings.isPrivate !== undefined) {
    group.settings.isPrivate = settings.isPrivate;
  }
  if (settings.allowInvites !== undefined) {
    group.settings.allowInvites = settings.allowInvites;
  }
  if (settings.splitMethod !== undefined) {
    group.settings.splitMethod = settings.splitMethod;
  }

  await group.save();
  return group.settings;
};

// Update notification settings
const updateNotificationSettings = async (groupId, notifications, userId) => {
  const validation = await validateGroupMembership(groupId, userId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const group = validation.group;

  // Ensure settings and notifications objects exist
  if (!group.settings) {
    group.settings = {
      isPrivate: false,
      allowInvites: true,
      currency: 'INR',
      splitMethod: 'equal',
      notifications: {
        newMember: true,
        newExpense: true,
        paymentReminder: true,
        settlementDue: true
      }
    };
  }

  if (!group.settings.notifications) {
    group.settings.notifications = {
      newMember: true,
      newExpense: true,
      paymentReminder: true,
      settlementDue: true
    };
  }

  group.settings.notifications = { ...group.settings.notifications, ...notifications };
  await group.save();

  return group.settings.notifications;
};

// Get group stats
const getGroupStats = async (groupId, userId) => {
  const validation = await validateGroupMembership(groupId, userId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Get split bills for the group
  const splitBills = await SplitBill.find({
    groupId: groupId
  }).populate('createdBy', 'name username')
    .populate('participants.userId', 'name username');

  // Calculate stats
  const totalAmount = splitBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const count = splitBills.length;
  const settled = splitBills.filter(bill => bill.isSettled || false).length;
  const pending = count - settled;

  // Group by category
  const categoryMap = new Map();
  splitBills.forEach(bill => {
    const category = bill.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { category, amount: 0, count: 0 });
    }
    const categoryData = categoryMap.get(category);
    categoryData.amount += bill.totalAmount || 0;
    categoryData.count += 1;
  });

  // Group by participant
  const participantMap = new Map();
  splitBills.forEach(bill => {
    if (bill.participants && Array.isArray(bill.participants)) {
      bill.participants.forEach(participant => {
        const userId = participant.userId?._id || participant.userId;
        const userName = participant.userId?.name || 'Unknown';
        if (!participantMap.has(userId.toString())) {
          participantMap.set(userId.toString(), {
            userId: userId.toString(),
            name: userName,
            totalAmount: 0,
            billCount: 0
          });
        }
        const participantData = participantMap.get(userId.toString());
        participantData.totalAmount += participant.amount || 0;
        participantData.billCount += 1;
      });
    }
  });

  return {
    overview: {
      totalAmount,
      count,
      settled,
      pending
    },
    byCategory: Array.from(categoryMap.values()),
    byParticipant: Array.from(participantMap.values())
  };
};

module.exports = {
  getUserGroups,
  createGroup,
  joinGroup,
  getGroupDetails,
  addMemberToGroup,
  splitBill,
  generateNewInviteCode,
  updateMemberRole,
  removeMemberFromGroup,
  leaveGroup,
  updateGroupInfo,
  updateGroupSettings,
  updateNotificationSettings,
  getGroupStats
};