const Group = require('../models/Group');
const User = require('../models/User');
const {
  validateGroupMembership,
  canAddMemberToGroup
} = require('../utils/groupUtils');

/**
 * Join group with invite code
 * @param {string} inviteCode - Group invite code
 * @param {string} userId - User ID joining the group
 * @returns {Object} - Updated group
 */
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

/**
 * Add member to group
 * @param {string} groupId - Group ID
 * @param {string} searchField - Field to search by (username, email)
 * @param {string} searchValue - Value to search for
 * @param {string} userId - User ID adding the member
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Updated group
 */
const addMemberToGroup = async (groupId, searchField, searchValue, userId, io) => {
  const group = await validateGroupMembership(groupId, userId);

  // Check if user is admin
  const adder = group.members.find(m => m.userId.toString() === userId);
  if (!adder || adder.role !== 'admin') {
    throw new Error('Only group admins can add members');
  }

  // Find user to add
  let userToAdd;
  if (searchField === 'username') {
    userToAdd = await User.findOne({ username: searchValue });
  } else if (searchField === 'email') {
    userToAdd = await User.findOne({ email: searchValue });
  } else {
    throw new Error('Invalid search field. Use username or email');
  }

  if (!userToAdd) {
    throw new Error(`User with ${searchField} '${searchValue}' not found`);
  }

  // Check if user can be added
  canAddMemberToGroup(group, userToAdd._id);

  // Add user to group
  group.members.push({
    userId: userToAdd._id,
    role: 'member'
  });

  await group.save();

  // Add group to user's groups
  if (userToAdd.groups) {
    userToAdd.groups.push(group._id);
    await userToAdd.save();
  }

  await group.populate('members.userId', 'name username email avatar');

  // Emit real-time update
  if (io) {
    io.emit('group-update', {
      type: 'member-added',
      groupId: group._id,
      member: {
        userId: userToAdd._id,
        name: userToAdd.name,
        role: 'member'
      }
    });
  }

  return group;
};

/**
 * Update member role
 * @param {string} groupId - Group ID
 * @param {string} memberId - Member ID to update
 * @param {string} role - New role
 * @param {string} userId - User ID making the change
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Updated group
 */
const updateMemberRole = async (groupId, memberId, role, userId, io) => {
  const group = await validateGroupMembership(groupId, userId);

  // Check if user is admin
  const updater = group.members.find(m => m.userId.toString() === userId);
  if (!updater || updater.role !== 'admin') {
    throw new Error('Only group admins can update member roles');
  }

  // Find member to update
  const member = group.members.find(m => m.userId.toString() === memberId);
  if (!member) {
    throw new Error('Member not found in group');
  }

  // Validate role
  const validRoles = ['admin', 'member'];
  if (!validRoles.includes(role)) {
    throw new Error('Invalid role. Must be admin or member');
  }

  // Update role
  member.role = role;
  await group.save();

  await group.populate('members.userId', 'name username email avatar');

  // Emit real-time update
  if (io) {
    io.emit('group-update', {
      type: 'member-role-updated',
      groupId: group._id,
      memberId: memberId,
      newRole: role
    });
  }

  return group;
};

/**
 * Remove member from group
 * @param {string} groupId - Group ID
 * @param {string} memberId - Member ID to remove
 * @param {string} userId - User ID making the removal
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Updated group
 */
const removeMemberFromGroup = async (groupId, memberId, userId, io) => {
  const group = await validateGroupMembership(groupId, userId);

  // Check if user is admin or removing themselves
  const remover = group.members.find(m => m.userId.toString() === userId);
  const isSelfRemoval = memberId === userId;
  const isAdmin = remover && remover.role === 'admin';

  if (!isSelfRemoval && !isAdmin) {
    throw new Error('Only group admins can remove other members');
  }

  // Find member to remove
  const memberIndex = group.members.findIndex(m => m.userId.toString() === memberId);
  if (memberIndex === -1) {
    throw new Error('Member not found in group');
  }

  // Remove member from group
  group.members.splice(memberIndex, 1);
  await group.save();

  // Remove group from user's groups
  const user = await User.findById(memberId);
  if (user && user.groups) {
    user.groups = user.groups.filter(g => g.toString() !== groupId);
    await user.save();
  }

  await group.populate('members.userId', 'name username email avatar');

  // Emit real-time update
  if (io) {
    io.emit('group-update', {
      type: 'member-removed',
      groupId: group._id,
      memberId: memberId
    });
  }

  return group;
};

/**
 * Leave group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID leaving the group
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Updated group
 */
const leaveGroup = async (groupId, userId, io) => {
  const group = await validateGroupMembership(groupId, userId);

  // Check if user is the only admin
  const adminCount = group.members.filter(m => m.role === 'admin' && m.isActive).length;
  const isAdmin = group.members.some(m => m.userId.toString() === userId && m.role === 'admin');

  if (isAdmin && adminCount === 1) {
    throw new Error('Cannot leave group as the only admin. Transfer admin role first or delete the group');
  }

  // Remove user from group
  group.members = group.members.filter(m => m.userId.toString() !== userId);
  await group.save();

  // Remove group from user's groups
  const user = await User.findById(userId);
  if (user && user.groups) {
    user.groups = user.groups.filter(g => g.toString() !== groupId);
    await user.save();
  }

  await group.populate('members.userId', 'name username email avatar');

  // Emit real-time update
  if (io) {
    io.emit('group-update', {
      type: 'member-left',
      groupId: group._id,
      memberId: userId
    });
  }

  return group;
};

module.exports = {
  joinGroup,
  addMemberToGroup,
  updateMemberRole,
  removeMemberFromGroup,
  leaveGroup
};