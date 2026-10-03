// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authMiddleware } = require('../../middleware/auth');

// Login endpoint (no signup as per requirements)
router.post('/login', authController.login);

// Forgot password endpoint
router.post('/forgot-password', authController.forgotPassword);

// Setup first-time profile details and reset password
router.post('/setup-profile', authController.setupProfile);

// Reset password endpoint
router.post('/reset-password', authMiddleware, authController.resetPassword);

// Get current user endpoint
router.get('/me', authController.getMe);

module.exports = router;
