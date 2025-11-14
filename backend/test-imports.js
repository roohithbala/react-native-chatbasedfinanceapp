// Test script to check for import errors
console.log('🧪 Testing backend imports...');

try {
  console.log('📦 Testing express...');
  const express = require('express');
  console.log('✅ Express OK');

  console.log('📦 Testing mongoose...');
  const mongoose = require('mongoose');
  console.log('✅ Mongoose OK');

  console.log('📦 Testing socket.io...');
  const socketIo = require('socket.io');
  console.log('✅ Socket.io OK');

  console.log('📦 Testing dotenv...');
  require('dotenv').config({ path: './.env' });
  console.log('✅ Dotenv OK');

  console.log('📦 Testing config modules...');
  const configureMiddleware = require('./config/middleware');
  const configureDatabase = require('./config/database');
  const configureSocket = require('./config/socket');
  const configureRoutes = require('./config/routes');
  console.log('✅ Config modules OK');

  console.log('📦 Testing models...');
  const User = require('./models/User');
  const Group = require('./models/Group');
  console.log('✅ Models OK');

  console.log('🎉 All imports successful!');

} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}