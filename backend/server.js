const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Group = require('./models/Group');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets');
const groupRoutes = require('./routes/groups');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
const splitBillRoutes = require('./routes/splitBills');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      'exp://10.30.251.172:8081',
      'http://10.30.251.172:8081',
      'http://localhost:8081',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000, // Increase ping timeout to 60 seconds
  pingInterval: 25000, // Ping every 25 seconds
  transports: ['websocket'], // Force WebSocket transport
  allowEIO3: true, // Allow Engine.IO v3 clients
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'exp://10.30.251.172:8081',
    'http://10.30.251.172:8081',
    'http://localhost:8081',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MongoDB URI is not defined. Please set MONGODB_URI in your .env file.');
  process.exit(1);
}

// Configure MongoDB connection
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10, // Maintain up to 10 socket connections
  retryWrites: true // Retry write operations if they fail
})
.then(async () => {
  // Set up error handlers after successful connection
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully.');
  });
  console.log('✅ Connected to MongoDB Atlas');
  
  // Create initial data
  try {
    const User = require('./models/User');
    const Budget = require('./models/Budget');
    const Expense = require('./models/Expense');
    
    // Check if we already have users
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      // Create a demo user
      const demoUser = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        password: await require('bcryptjs').hash('demo123', 10),
        isActive: true
      });
      
      const savedUser = await demoUser.save();
      console.log('✅ Demo user created');

      // Create initial budget
      const demoBudget = new Budget({
        userId: savedUser._id,
        categories: {
          Food: 500,
          Transport: 200,
          Entertainment: 300
        }
      });
      await demoBudget.save();
      console.log('✅ Initial budget created');

      // Create some sample expenses
      const sampleExpenses = [
        {
          userId: savedUser._id,
          description: 'Groceries',
          amount: 75.50,
          category: 'Food',
          date: new Date()
        },
        {
          userId: savedUser._id,
          description: 'Movie tickets',
          amount: 30.00,
          category: 'Entertainment',
          date: new Date()
        }
      ];

      await Expense.insertMany(sampleExpenses);
      console.log('✅ Sample expenses created');
    }
  } catch (error) {
    console.error('Error creating initial data:', error);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user's personal room for private messages and mentions
  socket.join(`user:${socket.user._id}`);

  socket.on('join-group', async (groupId) => {
    try {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        socket.emit('error', { message: 'Invalid group ID format' });
        return;
      }

      // Check if group exists and user is a member
      const group = await Group.findById(groupId);
      if (!group) {
        socket.emit('error', { message: 'Group not found' });
        return;
      }

      const isMember = group.members.some(member => 
        member.userId.toString() === socket.user._id.toString()
      );

      if (!isMember) {
        socket.emit('error', { message: 'You are not a member of this group' });
        return;
      }

      // Leave all other group rooms first
      const rooms = [...socket.rooms];
      rooms.forEach(room => {
        if (room !== socket.id && room !== `user:${socket.user._id}`) {
          socket.leave(room);
        }
      });

      // Join the new group room
      socket.join(groupId);
      console.log(`User ${socket.user._id} joined group ${groupId}`);
      socket.emit('group-joined', { groupId });
    } catch (error) {
      console.error('Error joining group:', error);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  socket.on('join-private-chat', (userId) => {
    const roomId = [socket.user._id, userId].sort().join(':');
    socket.join(`private:${roomId}`);
    console.log(`User ${socket.user._id} joined private chat with ${userId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { groupId, userId, message, type } = data;
      
      if (type === 'group' && groupId) {
        // Group message
        socket.to(groupId).emit('receive-message', {
          status: 'success',
          data: {
            message: {
              _id: new mongoose.Types.ObjectId().toString(),
              text: message.text,
              createdAt: new Date().toISOString(),
              user: {
                _id: socket.user._id.toString(),
                name: socket.user.name,
                avatar: socket.user.avatar
              },
              type: message.type || 'text',
              status: 'sent'
            }
          }
        });
      } else if (type === 'private' && userId) {
        // Private message
        const roomId = [socket.user._id, userId].sort().join(':');
        socket.to(`private:${roomId}`).emit('receive-message', {
          _id: new mongoose.Types.ObjectId().toString(),
          text: message.text,
          createdAt: new Date().toISOString(),
          user: {
            _id: socket.user._id.toString(),
            name: socket.user.name
          },
          messageType: 'text'
        });
      }
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user?._id);
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/split-bills', splitBillRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
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

// Helper function to extract mentions from message
async function extractMentions(text) {
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
}

// Financial command parser
async function parseFinancialCommand(text, userId, groupId) {
  const Expense = require('./models/Expense');
  const SplitBill = require('./models/SplitBill');
  const Budget = require('./models/Budget');

  try {
    if (text.startsWith('@split')) {
      return await handleSplitCommand(text, userId, groupId);
    } else if (text.startsWith('@addexpense')) {
      return await handleAddExpenseCommand(text, userId);
    } else if (text.startsWith('@setbudget')) {
      return await handleSetBudgetCommand(text, userId, groupId);
    }
  } catch (error) {
    console.error('Command parsing error:', error);
    return { type: 'error', message: 'Failed to process command' };
  }
}

async function handleSplitCommand(text, userId, groupId) {
  const SplitBill = require('./models/SplitBill');
  const User = require('./models/User');
  
  // Parse: @split Dinner $120 @alice @bob
  const parts = text.split(' ');
  const description = parts[1] || 'Expense';
  const amountMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  const mentions = text.match(/@\w+/g) || [];
  const participants = mentions.slice(1).map(m => m.replace('@', ''));

  if (amount > 0) {
    const splitAmount = amount / (participants.length + 1);
    
    const splitBill = new SplitBill({
      description,
      amount,
      splitAmount,
      participants: [...participants, userId],
      createdBy: userId,
      groupId,
      createdAt: new Date()
    });

    await splitBill.save();

    return {
      type: 'split-success',
      message: `✅ ${description} $${amount} split among ${participants.length + 1} people. Each pays $${splitAmount.toFixed(2)}`,
      data: splitBill
    };
  }
}

async function handleAddExpenseCommand(text, userId) {
  const Expense = require('./models/Expense');
  
  // Parse: @addexpense Coffee $5
  const parts = text.split(' ');
  const description = parts[1] || 'Expense';
  const amountMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  if (amount > 0) {
    const expense = new Expense({
      description,
      amount,
      category: 'Food', // Default category
      userId,
      createdAt: new Date()
    });

    await expense.save();

    return {
      type: 'expense-success',
      message: `💰 Added ${description} $${amount} to your expenses`,
      data: expense
    };
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = { app, io };