const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

// Rate limiting for login and registration to mitigate brute force attacks in production
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  skip: (req) => process.env.NODE_ENV === 'test' || (process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
  }
});

// Authentication endpoints
router.post('/login', authRateLimiter, authController.login);
router.post('/register', authRateLimiter, authController.register);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', optionalAuth, authController.logout);

module.exports = router;
