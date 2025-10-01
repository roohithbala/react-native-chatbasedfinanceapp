const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get recent chats (users with whom the current user has chatted)
router.get('/recent', auth, async (req, res) => {
  try {
    const recentChats = await DirectMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$text' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver', req.user._id] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastMessageAt: 1,
          unreadCount: 1,
          'user.name': 1,
          'user.username': 1,
          'user.avatar': 1
        }
      },
      {
        $sort: { lastMessageAt: -1 }
      }
    ]);

    res.json(recentChats);
  } catch (error) {
    console.error('Error getting recent chats:', error);
    res.status(500).json({ message: 'Error getting recent chats' });
  }
});

// Get chat history with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await DirectMessage.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'name username avatar')
    .populate('receiver', 'name username avatar');

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ message: 'Error getting chat history' });
  }
});

// Send a message to a user
router.post('/:userId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const receiver = await User.findById(req.params.userId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = new DirectMessage({
      sender: req.user._id,
      receiver: receiver._id,
      text: text.trim()
    });

    await message.save();
    await message.populate('sender', 'name username avatar');
    await message.populate('receiver', 'name username avatar');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Mark messages as read
router.put('/:userId/read', auth, async (req, res) => {
  try {
    await DirectMessage.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Clear chat history with a specific user
router.delete('/:userId/clear', auth, async (req, res) => {
  try {
    const result = await DirectMessage.deleteMany({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    });

    res.json({ 
      message: 'Chat cleared successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ message: 'Error clearing chat' });
  }
});

// Search users
router.get('/search/users', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name username avatar email')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

module.exports = router;
