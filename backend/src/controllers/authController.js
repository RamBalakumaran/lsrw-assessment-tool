// src/controllers/authController.js
const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status === 'INACTIVE') return res.status(403).json({ error: 'Account suspended or inactive' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role, forcePasswordReset: user.forcePasswordReset } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Enforce Password Guidelines
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must mix uppercase and lowercase letters.' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must include at least one number.' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must include at least one special character.' });
    }
    if (newPassword.toLowerCase().includes(user.email.split('@')[0].toLowerCase())) {
      return res.status(400).json({ error: 'New password must not contain your email prefix.' });
    }
    
    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Incorrect current password' });
    
    // Hash new password and update
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.forcePasswordReset = false;
    await user.save();
    
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await db.User.findByPk(decoded.id, {
      include: [
        { model: db.Group, as: 'groupMemberships' },
        { model: db.Group, as: 'administeredGroups' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({ user });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
