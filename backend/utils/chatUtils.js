const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Formats a message object for API responses
 * @param {Object} message - Message document or object
 * @returns {Object} - Formatted message object
 */
const formatMessage = (message) => {
  // Ensure message is an object after lean() query
  const msg = message.toObject ? message.toObject() : message;

  return {
    _id: msg._id.toString(),
    text: msg.text,
    createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
    user: msg.type === 'system' ? {
      _id: 'system',
      name: 'AI Assistant',
      username: 'ai',
      avatar: '🤖'
    } : {
      _id: msg.user._id?.toString() || msg.user._id,
      name: msg.user.name || '',
      avatar: msg.user.avatar || '',
      username: msg.user.username || ''
    },
    type: msg.type || 'text',
    status: msg.status || 'sent',
    groupId: msg.groupId?.toString(),
    readBy: (msg.readBy || []).map(r => ({
      userId: r.userId.toString(),
      readAt: r.readAt instanceof Date ? r.readAt.toISOString() : r.readAt
    })),
    commandType: msg.commandType || null,
    commandData: msg.commandData || null,
    systemData: msg.systemData || null,
    splitBillData: msg.splitBillData || null,
    mediaUrl: msg.mediaUrl || null,
    mediaType: msg.mediaType || null,
    mediaSize: msg.mediaSize || 0,
    mediaDuration: msg.mediaDuration || null,
    mediaWidth: msg.mediaWidth || null,
    mediaHeight: msg.mediaHeight || null,
    thumbnailUrl: msg.thumbnailUrl || null,
    fileName: msg.fileName || null,
    mimeType: msg.mimeType || null,
    mentions: (msg.mentions || []).map(m => m.toString()),
    reactions: (msg.reactions || []).map(r => ({
      userId: r.userId.toString(),
      emoji: r.emoji,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt
    }))
  };
};

/**
 * Extracts user mentions from message text
 * @param {string} text - Message text
 * @returns {Array} - Array of user ObjectIds
 */
const extractMentions = async (text) => {
  try {
    const mentions = text.match(/@(\w+)/g) || [];
    const usernames = mentions.map(m => m.substring(1));

    if (usernames.length === 0) return [];

    const users = await User.find({
      username: { $in: usernames }
    }).select('_id');

    return users.map(u => u._id);
  } catch (error) {
    console.error('Error extracting mentions:', error);
    return [];
  }
};

/**
 * Validates group membership for a user
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @returns {Object} - Validation result with group if valid
 */
const validateGroupMembership = async (groupId, userId) => {
  const mongoose = require('mongoose');
  const Group = require('../models/Group');

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new Error('Invalid group ID format');
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error('Group not found');
  }

  // Check if user is member of the group
  if (!group.members.some(member => member.userId.toString() === userId.toString() && member.isActive)) {
    throw new Error('You are not a member of this group');
  }

  return group;
};

/**
 * Formats message for socket emission
 * @param {Object} message - Message document
 * @returns {Object} - Formatted message for socket
 */
const formatMessageForSocket = (message) => {
  return {
    _id: message._id.toString(),
    text: message.text,
    createdAt: message.createdAt.toISOString(),
    user: {
      _id: message.user._id.toString(),
      name: message.user.name,
      username: message.user.username,
      avatar: message.user.avatar
    },
    type: message.type,
    status: 'sent',
    groupId: message.groupId,
    readBy: message.readBy,
    commandType: message.commandType,
    commandData: message.commandData,
    splitBillData: message.splitBillData,
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    mediaSize: message.mediaSize,
    mediaDuration: message.mediaDuration,
    mediaWidth: message.mediaWidth,
    mediaHeight: message.mediaHeight,
    thumbnailUrl: message.thumbnailUrl,
    fileName: message.fileName,
    mimeType: message.mimeType,
    mentions: message.mentions,
    reactions: message.reactions
  };
};

/**
 * Formats system message for socket emission
 * @param {Object} systemMessage - System message document
 * @param {string} groupId - Group ID
 * @param {Object} commandResult - Command execution result
 * @returns {Object} - Formatted system message for socket
 */
const formatSystemMessageForSocket = (systemMessage, groupId, commandResult) => {
  return {
    _id: systemMessage._id.toString(),
    text: systemMessage.text,
    createdAt: systemMessage.createdAt.toISOString(),
    user: {
      _id: 'system',
      name: 'AI Assistant',
      username: 'ai',
      avatar: '🤖'
    },
    type: 'system',
    status: 'sent',
    groupId: groupId,
    readBy: [],
    commandType: commandResult?.type,
    commandData: commandResult?.data || {},
    mentions: [],
    reactions: []
  };
};

module.exports = {
  formatMessage,
  extractMentions,
  validateGroupMembership,
  formatMessageForSocket,
  formatSystemMessageForSocket
};