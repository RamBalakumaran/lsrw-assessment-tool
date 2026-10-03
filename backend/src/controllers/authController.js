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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@nec.edu.in')) {
      return res.status(403).json({ error: 'Access denied. Only @nec.edu.in accounts are allowed to log in.' });
    }
    const user = await db.User.findOne({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status === 'INACTIVE') return res.status(403).json({ error: 'Account suspended or inactive' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role, forcePasswordReset: user.forcePasswordReset, firstName: user.firstName, lastName: user.lastName } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/auth/setup-profile
exports.setupProfile = async (req, res) => {
  const { userId, firstName, lastName, department, organization, newPassword, yearOfStudy } = req.body;
  if (!userId || !firstName || !lastName || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields: userId, firstName, lastName, and newPassword are required.' });
  }

  try {
    const user = await db.User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update basic details
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.yearOfStudy = yearOfStudy ? String(yearOfStudy).trim() : null;
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.forcePasswordReset = false;
    await user.save();



    return res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        yearOfStudy: user.yearOfStudy,
        forcePasswordReset: false 
      } 
    });
  } catch (err) {
    console.error('Setup profile error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
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
        { 
          model: db.Group, 
          as: 'groupMemberships',
          where: decoded.role === 'STUDENT' ? { status: 'ACTIVE' } : {},
          required: false
        },
        { model: db.Group, as: 'administeredGroups' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({ user });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.error('getMe error: Token expired');
    } else {
      console.error('getMe error:', err);
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await db.User.findOne({ where: { email: normalizedEmail } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // In a real app we'd generate a token. Here we'll just reset to 123456 and set forcePasswordReset
    const newPass = '123456';
    const bcrypt = require('bcryptjs');
    user.passwordHash = await bcrypt.hash(newPass, 10);
    user.forcePasswordReset = true;
    await user.save();

    const { notifyUser } = require('../../utils/notify');
    const loginLink = req.protocol + '://' + req.get('host') + '/login';
    await notifyUser({
      userId: user.id,
      title: 'Password Reset',
      message: 'Your password has been reset to: <b>' + newPass + '</b>.<br/><br/>Please login and change it.',
      type: 'INFO',
      link: loginLink
    });

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

