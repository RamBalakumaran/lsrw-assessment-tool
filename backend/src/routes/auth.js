// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login endpoint (no signup as per requirements)
router.post('/login', authController.login);

// Reset password endpoint
router.post('/reset-password', authController.resetPassword);

// Get current user endpoint
router.get('/me', authController.getMe);

module.exports = router;
