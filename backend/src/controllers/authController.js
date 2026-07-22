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

    // Map department to a Group membership
    if (department && department.trim()) {
      const groupName = department.trim();
      let group = await db.Group.findOne({ where: { name: groupName } });
      if (!group) {
        group = await db.Group.create({ name: groupName });
      }
      
      if (user.role === 'STUDENT') {
        await group.addMember(user);
      } else if (user.role === 'TEACHER') {
        await group.addAdmin(user);
      }
    }

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
