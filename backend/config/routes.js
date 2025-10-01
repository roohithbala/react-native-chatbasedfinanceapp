const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const expenseRoutes = require('../routes/expenses');
const budgetRoutes = require('../routes/budgets');
const groupRoutes = require('../routes/groups');
const chatRoutes = require('../routes/chat');
const aiRoutes = require('../routes/ai');
const splitBillRoutes = require('../routes/splitBills');
const directMessageRoutes = require('../routes/direct-messages');
const locationRoutes = require('../routes/locations');
const paymentRoutes = require('../routes/payments');
const relationshipRoutes = require('../routes/relationships');
const uploadRoutes = require('../routes/uploads');
const callRoutes = require('../routes/calls');

const configureRoutes = (app, io) => {
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
  app.use('/api/relationships', relationshipRoutes);
  app.use('/api/uploads', (req, res, next) => {
    req.io = io;
    next();
  }, uploadRoutes);
  app.use('/api/calls', callRoutes);

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

  return app;
};

module.exports = configureRoutes;