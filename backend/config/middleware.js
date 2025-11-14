const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const configureMiddleware = (app) => {
  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: true, // Allow all origins when in development
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

  // Serve static files from uploads directory
  app.use('/uploads', express.static('uploads'));

  return app;
};

module.exports = configureMiddleware;