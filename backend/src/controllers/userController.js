const db = require('../models');
const bcrypt = require('bcryptjs');

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: db.Group, as: 'groupMemberships', attributes: ['id', 'name'] },
        { model: db.Group, as: 'administeredGroups', attributes: ['id', 'name'] }
      ]
    });
    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/users/invite
exports.inviteUser = async (req, res) => {
  const { firstName, lastName, email, role, password, teacherId, groupId } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  try {
    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const newUser = await db.User.create({
      firstName,
      lastName,
      email,
      role,
      passwordHash,
      status: 'ACTIVE',
      forcePasswordReset: true
    });

    if (groupId && role === 'STUDENT') {
       const group = await db.Group.findByPk(groupId);
       if (group) await group.addMember(newUser);
    } else if (groupId && role === 'TEACHER') {
       const group = await db.Group.findByPk(groupId);
       if (group) await group.addAdmin(newUser);
    }

    const userObj = newUser.toJSON();
    delete userObj.passwordHash;
    return res.status(201).json(userObj);
  } catch (err) {
    console.error('Error inviting user:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/users/:id
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { status, role } = req.body;

  try {
    const user = await db.User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (status) user.status = status;
    if (role) user.role = role;

    await user.save();

    const userObj = user.toJSON();
    delete userObj.passwordHash;
    return res.json(userObj);
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
