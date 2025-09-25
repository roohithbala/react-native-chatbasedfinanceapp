const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const configureMiddleware = (app) => {
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

  return app;
};

module.exports = configureMiddleware;