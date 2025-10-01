const Group = require('../models/Group');
const { validateGroupMembership, generateInviteCode } = require('../utils/groupUtils');

/**
 * Generate new invite code for group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID requesting new code
 * @returns {Object} - Updated group with new invite code
 */
const generateNewInviteCode = async (groupId, userId) => {
  const group = await validateGroupMembership(groupId, userId);

  // Check if user is admin
  const member = group.members.find(m => m.userId.toString() === userId);
  if (!member || member.role !== 'admin') {
    throw new Error('Only group admins can generate new invite codes');
  }

  // Generate new invite code
  const newInviteCode = generateInviteCode();
  group.inviteCode = newInviteCode;
  await group.save();

  await group.populate('members.userId', 'name username email avatar');

  return {
    group,
    newInviteCode
  };
};

module.exports = {
  generateNewInviteCode
};