const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './.env' });

console.log('🚀 Starting minimal server for testing...');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Minimal server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    platform: process.platform
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Minimal backend is working!',
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
});

// Login endpoint (minimal)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Simple mock login for testing
  if (email && password) {
    res.json({
      token: 'mock_jwt_token_for_testing',
      user: {
        id: 'mock_user_id',
        name: 'Test User',
        email: email,
        username: 'testuser'
      }
    });
  } else {
    res.status(400).json({
      message: 'Email and password required'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '10.209.229.172';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Minimal server running on ${HOST}:${PORT}`);
  console.log(`🔗 Health Check: http://${HOST}:${PORT}/api/health`);
  console.log(`🔗 Test Endpoint: http://${HOST}:${PORT}/api/test`);
}).on('error', (err) => {
  console.error('❌ Failed to start minimal server:', err.message);
  process.exit(1);
});