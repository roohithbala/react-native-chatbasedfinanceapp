const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get recent chats (users with whom the current user has chatted)
router.get('/recent', auth, async (req, res) => {
  try {
    // Get all messages involving the current user
    const messages = await DirectMessage.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name username avatar')
    .populate('receiver', 'name username avatar')
    .lean();

    // Group by chat partner and calculate unread count
    const chatsMap = new Map();

    for (const msg of messages) {
      // Determine the other user (chat partner)
      const isCurrentUserSender = msg.sender._id.toString() === req.user._id.toString();
      const chatPartnerId = isCurrentUserSender ? msg.receiver._id : msg.sender._id;
      const chatPartnerIdStr = chatPartnerId.toString();

      if (!chatsMap.has(chatPartnerIdStr)) {
        const chatPartner = isCurrentUserSender ? msg.receiver : msg.sender;
        chatsMap.set(chatPartnerIdStr, {
          _id: chatPartnerId,
          user: {
            name: chatPartner.name,
            username: chatPartner.username,
            avatar: chatPartner.avatar || chatPartner.name?.charAt(0)?.toUpperCase() || '👤'
          },
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          unreadCount: 0
        });
      }

      // Count unread messages (messages sent TO current user that haven't been read)
      if (!isCurrentUserSender) {
        const isRead = msg.readBy && msg.readBy.some(
          read => read.userId && read.userId.toString() === req.user._id.toString()
        );
        if (!isRead) {
          const chat = chatsMap.get(chatPartnerIdStr);
          chat.unreadCount++;
        }
      }
    }

    // Convert map to array and sort by last message time
    const recentChats = Array.from(chatsMap.values())
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    console.log(`📊 Recent chats for user ${req.user._id}:`, 
      recentChats.map(c => ({
        partner: c.user.name,
        unread: c.unreadCount,
        lastMsg: c.lastMessage?.substring(0, 30)
      }))
    );

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

    // Populate splitBillData for messages that have it
    const populatedMessages = await Promise.all(messages.map(async (message) => {
      const messageObj = message.toObject();
      
      // If this is a split bill message, fetch the latest data from the SplitBill collection
      if (messageObj.splitBillData && messageObj.splitBillData._id && 
          (messageObj.type === 'split_bill' || messageObj.type === 'split_bill_request')) {
        try {
          const SplitBill = require('../models/SplitBill');
          const latestSplitBill = await SplitBill.findById(messageObj.splitBillData._id)
            .populate('createdBy', 'name username avatar')
            .populate('participants.userId', 'name username avatar')
            .lean();
          
          if (latestSplitBill) {
            console.log('🔄 Loaded fresh split bill data for message:', {
              messageId: messageObj._id,
              splitBillId: latestSplitBill._id,
              participants: latestSplitBill.participants.map(p => ({
                userId: p.userId._id,
                name: p.userId.name,
                isPaid: p.isPaid
              }))
            });
            
            messageObj.splitBillData = {
              _id: latestSplitBill._id,
              description: latestSplitBill.description,
              totalAmount: latestSplitBill.totalAmount,
              createdBy: latestSplitBill.createdBy,
              participants: latestSplitBill.participants.map(p => ({
                userId: typeof p.userId === 'object' ? p.userId._id : p.userId,
                amount: p.amount,
                percentage: p.percentage,
                isPaid: p.isPaid || false,
                isRejected: p.isRejected || false,
                paidAt: p.paidAt,
                rejectedAt: p.rejectedAt
              })),
              isSettled: latestSplitBill.isSettled,
              settledAt: latestSplitBill.settledAt
            };
          }
        } catch (err) {
          console.error('⚠️ Error fetching latest split bill data:', err);
          // Fall back to existing splitBillData
        }
      }
      
      return messageObj;
    }));

    res.json(populatedMessages.reverse());
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ message: 'Error getting chat history' });
  }
});

// Send a message to a user
router.post('/:userId', auth, async (req, res) => {
  try {
    const { text, type, splitBillData } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const receiver = await User.findById(req.params.userId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow splitBillData for split bill messages
    const shouldIncludeSplitBillData = splitBillData && (
      type === 'split_bill' || 
      type === 'split_bill_request' || 
      text.trim().startsWith('✅') ||
      text.includes('Split bill request:') ||
      text.includes('Split bill created:')
    );

    console.log('📋 Split bill message check:', {
      hasSplitBillData: !!splitBillData,
      type,
      shouldInclude: shouldIncludeSplitBillData,
      splitBillId: splitBillData?._id
    });

    const message = new DirectMessage({
      sender: req.user._id,
      receiver: receiver._id,
      text: text.trim(),
      type: type || 'text',
      splitBillData: shouldIncludeSplitBillData ? splitBillData : undefined,
      readBy: [{
        userId: req.user._id,
        readAt: new Date()
      }]
    });

    await message.save();
    await message.populate('sender', 'name username avatar');
    await message.populate('receiver', 'name username avatar');

    // Populate splitBillData if present
    let populatedSplitBillData = message.splitBillData;
    if (shouldIncludeSplitBillData && message.splitBillData) {
      // Get sender info from populated message
      const senderInfo = {
        _id: message.sender._id.toString(),
        name: message.sender.name,
        avatar: message.sender.avatar
      };
      
      const receiverInfo = {
        _id: receiver._id.toString(),
        name: receiver.name,
        avatar: receiver.avatar
      };
      
      // Ensure splitBillData has the required fields for the UI
      populatedSplitBillData = {
        ...message.splitBillData,
        createdBy: message.splitBillData.createdBy && message.splitBillData.createdBy._id ? {
          _id: message.splitBillData.createdBy._id.toString(),
          name: message.splitBillData.createdBy.name,
          avatar: message.splitBillData.createdBy.avatar
        } : senderInfo, // Use sender as fallback
        participants: message.splitBillData.participants?.map((p) => {
          // Extract userId information
          let userId, userName, userAvatar;
          if (typeof p.userId === 'object' && p.userId._id) {
            userId = p.userId._id.toString();
            userName = p.userId.name;
            userAvatar = p.userId.avatar;
          } else if (typeof p.userId === 'string' || p.userId instanceof require('mongoose').Types.ObjectId) {
            userId = p.userId.toString();
            // If userId matches receiver, use receiver info, otherwise use sender
            if (userId === receiverInfo._id) {
              userName = receiverInfo.name;
              userAvatar = receiverInfo.avatar;
            } else {
              userName = senderInfo.name;
              userAvatar = senderInfo.avatar;
            }
          } else {
            // Fallback to receiver
            userId = receiverInfo._id;
            userName = receiverInfo.name;
            userAvatar = receiverInfo.avatar;
          }
          
          return {
            userId: {
              _id: userId,
              name: userName,
              avatar: userAvatar
            },
            amount: p.amount,
            percentage: p.percentage,
            isPaid: p.isPaid || false,
            paidAt: p.paidAt
          };
        }) || []
      };
      
      console.log('📋 Populated split bill data:', {
        splitBillId: populatedSplitBillData._id,
        createdById: populatedSplitBillData.createdBy._id,
        createdByName: populatedSplitBillData.createdBy.name,
        participantsCount: populatedSplitBillData.participants.length,
        participants: populatedSplitBillData.participants.map(p => ({
          userId: p.userId._id,
          name: p.userId.name,
          amount: p.amount
        }))
      });
    }

    // Emit real-time message event to both sender and receiver
    const io = req.io;
    if (io) {
      // Format message for socket with all required fields
      const socketMessage = {
        _id: message._id.toString(),
        text: message.text,
        sender: {
          _id: message.sender._id.toString(),
          name: message.sender.name,
          username: message.sender.username,
          avatar: message.sender.avatar
        },
        receiver: {
          _id: message.receiver._id.toString(),
          name: message.receiver.name,
          username: message.receiver.username,
          avatar: message.receiver.avatar
        },
        type: message.type,
        status: 'sent',
        splitBillData: populatedSplitBillData,
        createdAt: message.createdAt.toISOString(),
        readBy: message.readBy
      };

      // Send to receiver's room
      io.to(`user_${receiver._id}`).emit('newMessage', socketMessage);
      // Send to sender's room (for consistency across devices)
      io.to(`user_${req.user._id}`).emit('newMessage', socketMessage);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Mark messages as read
router.put('/:userId/read', auth, async (req, res) => {
  try {
    const result = await DirectMessage.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        'readBy.userId': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            userId: req.user._id,
            readAt: new Date()
          }
        },
        $set: {
          status: 'read'
        }
      }
    );

    console.log(`📖 Marked ${result.modifiedCount} messages as read from ${req.params.userId} to ${req.user._id}`);

    // Emit socket event to update chat list for both users
    const io = req.app.get('io');
    if (io) {
      // Notify sender that their messages were read
      io.to(`user_${req.params.userId}`).emit('messagesRead', {
        userId: req.user._id,
        readAt: new Date()
      });

      // Notify receiver (current user) to update unread count
      io.to(`user_${req.user._id}`).emit('messagesRead', {
        userId: req.params.userId,
        readAt: new Date()
      });
    }

    res.json({ 
      message: 'Messages marked as read',
      count: result.modifiedCount
    });
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

// Delete a single message
router.delete('/message/:messageId', auth, async (req, res) => {
  try {
    const message = await DirectMessage.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Delete media file if exists
    if (message.mediaUrl) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', message.mediaUrl);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('✅ Media file deleted:', filePath);
        } catch (err) {
          console.error('⚠️ Failed to delete media file:', err);
        }
      }
    }

    await DirectMessage.findByIdAndDelete(req.params.messageId);

    // Emit socket event to notify other user
    const io = req.io;
    if (io) {
      const receiverId = message.receiver.toString();
      const senderId = message.sender.toString();
      
      const deleteEvent = {
        messageId: req.params.messageId,
        userId: receiverId === req.user._id.toString() ? senderId : receiverId
      };
      
      io.to(`user_${receiverId}`).emit('messageDeleted', deleteEvent);
      io.to(`user_${senderId}`).emit('messageDeleted', deleteEvent);
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
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
