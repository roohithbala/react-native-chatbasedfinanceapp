const express = require('express');
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

// Get group messages
router.get('/:groupId/messages', auth, async (req, res) => {
  try {
    const result = await chatController.getGroupMessages(req.params.groupId, req.userId);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('not a member') ? 403 : 500;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Send message
router.post('/:groupId/messages', auth, async (req, res) => {
  try {
    const result = await chatController.sendMessage(req.params.groupId, req.userId, req.body, req.io);

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error sending message:', error);
    const statusCode = error.message.includes('required') || error.message.includes('not found') ? 400 : 500;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

// Mark messages as read
router.put('/:groupId/messages/read', auth, async (req, res) => {
  try {
    const result = await chatController.markMessagesAsRead(req.params.groupId, req.userId, req.body.messageIds);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark messages as read'
    });
  }
});

// Add reaction to message
router.post('/:groupId/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const result = await chatController.addReactionToMessage(
      req.params.groupId,
      req.params.messageId,
      req.userId,
      req.body.emoji
    );

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    const statusCode = error.message === 'Message not found' ? 404 : 500;
    res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;