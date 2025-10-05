const express = require('express');
const http = require('http');
require('dotenv').config({ path: './.env' });

console.log('🚀 Starting server...');

// Import configuration modules
console.log('📦 Importing config modules...');
const configureMiddleware = require('./config/middleware');
const configureDatabase = require('./config/database');
const configureSocket = require('./config/socket');
const configureRoutes = require('./config/routes');

console.log('✅ Config modules imported');

const app = express();
const server = http.createServer(app);

console.log('🔧 Configuring middleware...');
// Configure middleware
configureMiddleware(app);
console.log('✅ Middleware configured');

console.log('🗄️ Configuring database...');
// Configure database connection
configureDatabase();
console.log('✅ Database configured');

console.log('🔌 Configuring socket...');
// Configure Socket.io
const io = configureSocket(server);
console.log('✅ Socket configured');

console.log('🛣️ Configuring routes...');
// Configure routes
configureRoutes(app, io);
console.log('✅ Routes configured');

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
  console.error('Stack trace:', err.stack);
  // Don't exit immediately, try to keep server running
  setTimeout(() => {
    console.log('🔄 Attempting to keep server alive after uncaught exception...');
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack trace:', reason?.stack || reason);
  // Don't exit immediately, try to keep server running
  setTimeout(() => {
    console.log('🔄 Attempting to keep server alive after unhandled rejection...');
  }, 1000);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Keep server alive with periodic health checks
setInterval(() => {
  console.log(`💓 Server heartbeat - ${new Date().toISOString()} - Port: ${PORT}`);
}, 300000); // Every 5 minutes

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://10.120.178.172:8081'}`);
  console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🕐 Server started at: ${new Date().toISOString()}`);
}).on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});

module.exports = { app, io };