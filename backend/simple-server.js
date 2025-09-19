const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors({
  origin: [
    'http://10.63.153.172:8081',
    'http://10.63.153.172:3001',
    'http://localhost:8081',
    'http://localhost:3001'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Offline Mode'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// MongoDB connection (optional)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance';
console.log('🔄 Attempting to connect to MongoDB...');
console.log('📍 Connection URI:', mongoUri);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch(err => {
  console.log('⚠️  MongoDB connection failed, running in offline mode');
  console.log('📝 Using in-memory data store for development');
  console.error('Connection error:', err.message);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: http://10.63.153.172:8081`);
}).on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});