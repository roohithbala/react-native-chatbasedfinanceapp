const Message = require('../models/Message');
const chatUtils = require('../utils/chatUtils');

/**
 * Get messages for a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID requesting messages
 * @returns {Object} - Messages data with group info
 */
const getGroupMessages = async (groupId, userId) => {
  const group = await chatUtils.validateGroupMembership(groupId, userId);

  const messages = await Message.find({ groupId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate({
      path: 'user',
      select: 'name avatar username _id'
    })
    .lean();

  const formattedMessages = messages.map(msg => chatUtils.formatMessage(msg));

  return {
    messages: formattedMessages,
    group: {
      _id: group._id,
      name: group.name,
      members: group.members
    }
  };
};

module.exports = {
  getGroupMessages
};