const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');

const configureSocket = (server) => {
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

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user?._id);
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
  });

  return io;
};

module.exports = configureSocket;