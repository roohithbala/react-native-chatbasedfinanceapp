const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const Group = require('./models/Group');
const Message = require('./models/Message');
const DirectMessage = require('./models/DirectMessage');
const Expense = require('./models/Expense');
const Budget = require('./models/Budget');
const SplitBill = require('./models/SplitBill');
const Location = require('./models/Location');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets');
const groupRoutes = require('./routes/groups');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
const splitBillRoutes = require('./routes/splitBills');
const directMessageRoutes = require('./routes/direct-messages');
const locationRoutes = require('./routes/locations');
const paymentRoutes = require('./routes/payments');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      'http://10.40.155.172:8081',
      'http://10.40.155.172:3001',
      'http://localhost:8081',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  connectTimeout: 20000,
  maxHttpBufferSize: 1e8
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://10.40.155.172:8081',
    'http://10.40.155.172:3001',
    'http://localhost:8081',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - increased for mobile app usage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased from 500 to 2000 requests per window for mobile app usage
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Ensure JSON response
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with local fallback
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance';

console.log('🔄 Attempting to connect to MongoDB...');
console.log('📍 Connection URI:', mongoUri);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');

  // Monitor connection events
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });

  // Create initial data
  try {
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('📝 Creating demo user...');
      const demoUser = new User({
        name: 'Demo User',
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'demo123',
        isActive: true
      });

      await demoUser.save();
      console.log('✅ Demo user created');

      // Create demo groups
      const personalGroup = new Group({
        name: 'Personal',
        avatar: '👤',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [{
          userId: demoUser._id,
          role: 'admin'
        }],
        budgets: []
      });

      const familyGroup = new Group({
        name: 'Family',
        avatar: '👨‍👩‍👧‍👦',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [{
          userId: demoUser._id,
          role: 'admin'
        }],
        budgets: []
      });

      await personalGroup.save();
      await familyGroup.save();

      demoUser.groups = [personalGroup._id, familyGroup._id];
      await demoUser.save();

      console.log('✅ Demo groups created');
    }
  } catch (error) {
    console.error('Error creating initial data:', error);
  }
})
.catch(err => {
  console.log('⚠️  MongoDB connection failed, running in offline mode');
  console.log('📝 Using in-memory data store for development');
  console.error('Connection error:', err.message);
  // Don't exit the process, continue with offline mode
});

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    socket.user = { _id: decoded.userId, name: 'User' };
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Track typing users per group
  const typingUsers = new Map();

  socket.on('join-group', (groupId) => {
    socket.join(groupId);
    socket.emit('group-joined', { groupId });
    console.log(`User ${socket.user?._id} joined group ${groupId}`);
  });

  socket.on('join-private-chat', (userId) => {
    socket.join(`private-${userId}`);
    socket.emit('private-chat-joined', { userId });
    console.log(`User ${socket.user?._id} joined private chat with ${userId}`);
  });

  // Typing indicators
  socket.on('typing-start', (data) => {
    const { groupId } = data;
    if (!groupId) return;

    if (!typingUsers.has(groupId)) {
      typingUsers.set(groupId, new Set());
    }

    const groupTyping = typingUsers.get(groupId);
    groupTyping.add(socket.user._id);

    // Broadcast typing start to other group members
    socket.to(groupId).emit('user-typing-start', {
      groupId,
      user: {
        _id: socket.user._id,
        name: socket.user.name
      }
    });
  });

  socket.on('typing-stop', (data) => {
    const { groupId } = data;
    if (!groupId) return;

    const groupTyping = typingUsers.get(groupId);
    if (groupTyping) {
      groupTyping.delete(socket.user._id);

      // Broadcast typing stop to other group members
      socket.to(groupId).emit('user-typing-stop', {
        groupId,
        user: {
          _id: socket.user._id,
          name: socket.user.name
        }
      });
    }
  });

  // Read receipts
  socket.on('mark-read', async (data) => {
    try {
      const { messageId, groupId } = data;

      if (!messageId || !groupId) return;

      // Find and update the message
      const message = await Message.findById(messageId);
      if (!message) return;

      // Check if user is a member of the group
      const group = await Group.findById(groupId);
      if (!group) return;

      const isMember = group.members.some(member =>
        member.userId.toString() === socket.user._id.toString() && member.isActive
      );

      if (!isMember) return;

      // Mark message as read by this user
      await message.markAsRead(socket.user._id);

      // Broadcast read receipt to other group members
      socket.to(groupId).emit('message-read', {
        messageId,
        userId: socket.user._id,
        readAt: new Date()
      });

      // Update message status if all members have read it
      const allMembersRead = group.members.every(member => {
        if (member.userId.toString() === message.user._id.toString()) return true; // Sender doesn't need to read their own message
        return message.readBy.some(read => read.userId.toString() === member.userId.toString());
      });

      if (allMembersRead && message.status !== 'read') {
        message.status = 'read';
        await message.save();

        // Broadcast status update
        io.to(groupId).emit('message-status-update', {
          messageId,
          status: 'read',
          userId: socket.user._id
        });
      }

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  socket.on('send-message', async (data) => {
    try {
      const { groupId, userId, message, type } = data;

      if (!message || !message.text?.trim()) {
        socket.emit('error', { message: 'Message text is required' });
        return;
      }

      // Handle group messages
      if (groupId) {
        // Validate group membership
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error', { message: 'Group not found' });
          return;
        }

        const isMember = group.members.some(member =>
          member.userId.toString() === socket.user._id.toString() && member.isActive
        );

        if (!isMember) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        // Create message in database
        const dbMessage = new Message({
          text: message.text.trim(),
          user: {
            _id: socket.user._id,
            name: socket.user.name,
            avatar: '👤'
          },
          groupId,
          type: message.type || 'text',
          status: 'sent',
          readBy: [{
            userId: socket.user._id,
            readAt: new Date()
          }]
        });

        await dbMessage.save();

        // Format message for socket emission
        const formattedMessage = {
          _id: dbMessage._id.toString(),
          text: dbMessage.text,
          createdAt: dbMessage.createdAt.toISOString(),
          user: {
            _id: socket.user._id,
            name: socket.user.name,
            avatar: '👤'
          },
          type: dbMessage.type,
          status: 'sent',
          groupId: groupId,
          readBy: dbMessage.readBy,
          mentions: [],
          reactions: []
        };

        // Emit to all group members except sender
        socket.to(groupId).emit('receive-message', formattedMessage);

        // Also emit back to sender for confirmation
        socket.emit('message-sent', formattedMessage);

      } else if (userId) {
        // Handle private messages
        const recipient = await User.findById(userId);
        if (!recipient) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Create direct message
        const directMessage = new DirectMessage({
          sender: socket.user._id,
          receiver: userId,
          text: message.text.trim()
        });

        await directMessage.save();

        // Format message for socket emission
        const formattedMessage = {
          _id: directMessage._id.toString(),
          text: directMessage.text,
          createdAt: directMessage.createdAt.toISOString(),
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            avatar: '👤'
          },
          receiver: {
            _id: userId,
            name: recipient.name,
            avatar: recipient.avatar
          },
          read: false
        };

        // Emit to recipient
        socket.to(`private-${userId}`).emit('receive-message', formattedMessage);

        // Emit confirmation to sender
        socket.emit('message-sent', formattedMessage);
      }
    } catch (error) {
      console.error('Socket send-message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user?._id);

    // Clean up typing indicators
    typingUsers.forEach((users, groupId) => {
      if (users.has(socket.user._id)) {
        users.delete(socket.user._id);
        // Notify others that user stopped typing
        socket.to(groupId).emit('user-typing-stop', {
          groupId,
          user: {
            _id: socket.user._id,
            name: socket.user.name
          }
        });
      }
    });
  });

  // Real-time expense updates
  socket.on('expense-created', async (data) => {
    try {
      const { expense, groupId } = data;

      // Broadcast to group members if it's a group expense
      if (groupId) {
        socket.to(groupId).emit('expense-update', {
          type: 'created',
          expense: expense,
          groupId: groupId
        });
      }

      // Also broadcast to user's personal room for personal expenses
      socket.to(`user-${socket.user._id}`).emit('expense-update', {
        type: 'created',
        expense: expense
      });

    } catch (error) {
      console.error('Error broadcasting expense creation:', error);
    }
  });

  socket.on('expense-updated', async (data) => {
    try {
      const { expense, groupId } = data;

      // Broadcast to group members if it's a group expense
      if (groupId) {
        socket.to(groupId).emit('expense-update', {
          type: 'updated',
          expense: expense,
          groupId: groupId
        });
      }

      // Also broadcast to user's personal room
      socket.to(`user-${socket.user._id}`).emit('expense-update', {
        type: 'updated',
        expense: expense
      });

    } catch (error) {
      console.error('Error broadcasting expense update:', error);
    }
  });

  socket.on('expense-deleted', async (data) => {
    try {
      const { expenseId, groupId } = data;

      // Broadcast to group members if it's a group expense
      if (groupId) {
        socket.to(groupId).emit('expense-update', {
          type: 'deleted',
          expenseId: expenseId,
          groupId: groupId
        });
      }

      // Also broadcast to user's personal room
      socket.to(`user-${socket.user._id}`).emit('expense-update', {
        type: 'deleted',
        expenseId: expenseId
      });

    } catch (error) {
      console.error('Error broadcasting expense deletion:', error);
    }
  });

  // Real-time group updates
  socket.on('group-created', async (data) => {
    try {
      const { group } = data;

      // Broadcast to all users (or specific users who should see this group)
      // For now, broadcast to the creator's "friends" or all connected users
      socket.broadcast.emit('group-update', {
        type: 'created',
        group: group
      });

    } catch (error) {
      console.error('Error broadcasting group creation:', error);
    }
  });

  socket.on('group-updated', async (data) => {
    try {
      const { group } = data;

      // Broadcast to group members
      socket.to(group._id.toString()).emit('group-update', {
        type: 'updated',
        group: group
      });

    } catch (error) {
      console.error('Error broadcasting group update:', error);
    }
  });

  socket.on('member-added', async (data) => {
    try {
      const { groupId, member } = data;

      // Broadcast to group members
      socket.to(groupId).emit('group-update', {
        type: 'member-added',
        groupId: groupId,
        member: member
      });

    } catch (error) {
      console.error('Error broadcasting member addition:', error);
    }
  });

  // Real-time budget updates
  socket.on('budget-updated', async (data) => {
    try {
      const { budget, groupId } = data;

      // Broadcast to group members if it's a group budget
      if (groupId) {
        socket.to(groupId).emit('budget-update', {
          type: 'updated',
          budget: budget,
          groupId: groupId
        });
      }

      // Also broadcast to user's personal room
      socket.to(`user-${socket.user._id}`).emit('budget-update', {
        type: 'updated',
        budget: budget
      });

    } catch (error) {
      console.error('Error broadcasting budget update:', error);
    }
  });

  // Real-time split bill updates
  socket.on('split-bill-created', async (data) => {
    try {
      const { splitBill, groupId } = data;

      // Broadcast to group members
      socket.to(groupId).emit('split-bill-update', {
        type: 'created',
        splitBill: splitBill,
        groupId: groupId
      });

    } catch (error) {
      console.error('Error broadcasting split bill creation:', error);
    }
  });

  socket.on('split-bill-updated', async (data) => {
    try {
      const { splitBill, groupId } = data;

      // Broadcast to group members
      socket.to(groupId).emit('split-bill-update', {
        type: 'updated',
        splitBill: splitBill,
        groupId: groupId
      });

    } catch (error) {
      console.error('Error broadcasting split bill update:', error);
    }
  });

  // Join user-specific room for personal updates
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${socket.user?._id} joined personal room user-${userId}`);
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', (req, res, next) => {
  req.io = io;
  next();
}, expenseRoutes);
app.use('/api/budgets', (req, res, next) => {
  req.io = io;
  next();
}, budgetRoutes);
app.use('/api/groups', (req, res, next) => {
  req.io = io;
  next();
}, groupRoutes);
app.use('/api/chat', (req, res, next) => {
  req.io = io;
  next();
}, chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/split-bills', (req, res, next) => {
  req.io = io;
  next();
}, splitBillRoutes);
app.use('/api/direct-messages', directMessageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Offline Mode'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://10.40.155.172:8081'}`);
}).on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

module.exports = { app, io };