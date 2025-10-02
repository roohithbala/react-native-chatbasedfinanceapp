const crypto = require('crypto');

// Generate unique invite code
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex');
};

// Validate group membership and permissions
const validateGroupMembership = async (groupId, userId, requiredRole = null) => {
  const group = await require('../models/Group').findOne({
    _id: groupId,
    'members.userId': userId,
    isActive: true
  });

  if (!group) {
    throw new Error('Group not found or access denied');
  }

  if (requiredRole) {
    const member = group.members.find(m => m.userId.toString() === userId && m.isActive);
    if (!member || member.role !== requiredRole) {
      throw new Error('Insufficient permissions');
    }
  }

  return group;
};

// Check if user can be added to group
const canAddMemberToGroup = (group, userId) => {
  // Check if group is "Personal" type
  if (group.name === 'Personal') {
    return { canAdd: false, error: 'Cannot add members to Personal group. Create a new group for sharing expenses.' };
  }

  // Check if user is already a member
  const isMember = group.members.some(member =>
    member.userId.toString() === userId
  );

  if (isMember) {
    return { canAdd: false, error: 'User is already a member' };
  }

  return { canAdd: true };
};

// Calculate split bill participants
const calculateSplitParticipants = (participants, amount, splitType) => {
  if (splitType === 'equal') {
    const equalPercentage = 100 / participants.length;
    const splitAmount = amount / participants.length;

    return participants.map(userId => ({
      userId: userId,
      amount: parseFloat(splitAmount.toFixed(2)),
      percentage: equalPercentage,
      isPaid: false
    }));
  } else if (splitType === 'percentage') {
    // Validate percentages sum to 100
    const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Percentages must sum to 100%');
    }

    return participants.map(p => ({
      userId: p.userId,
      amount: parseFloat(((amount * p.percentage) / 100).toFixed(2)),
      percentage: p.percentage,
      isPaid: false
    }));
  }

  throw new Error('Invalid split type');
};

// Validate group settings update
const validateGroupSettings = (settings) => {
  const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];
  const validSplitMethods = ['equal', 'percentage', 'custom'];

  if (settings.currency && !validCurrencies.includes(settings.currency)) {
    throw new Error(`Invalid currency. Must be one of: ${validCurrencies.join(', ')}`);
  }

  if (settings.splitMethod && !validSplitMethods.includes(settings.splitMethod)) {
    throw new Error(`Invalid split method. Must be one of: ${validSplitMethods.join(', ')}`);
  }

  if (settings.isPrivate !== undefined && typeof settings.isPrivate !== 'boolean') {
    throw new Error('isPrivate must be a boolean');
  }

  if (settings.allowInvites !== undefined && typeof settings.allowInvites !== 'boolean') {
    throw new Error('allowInvites must be a boolean');
  }
};

module.exports = {
  generateInviteCode,
  validateGroupMembership,
  canAddMemberToGroup,
  calculateSplitParticipants,
  validateGroupSettings
};