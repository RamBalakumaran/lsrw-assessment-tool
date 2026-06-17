const db = require('../models');

// GET /api/groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await db.Group.findAll({
      include: [
        { model: db.User, as: 'admins', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });
    return res.json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/groups/:id
exports.getGroupById = async (req, res) => {
  const { id } = req.params;
  try {
    const group = await db.Group.findByPk(id, {
      include: [
        { model: db.User, as: 'admins', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] },
        { model: db.User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] },
        { model: db.Task, as: 'tasks' }
      ]
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    return res.json(group);
  } catch (err) {
    console.error('Error fetching group by ID:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/groups
exports.createGroup = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });
  try {
    const newGroup = await db.Group.create({ name });
    return res.status(201).json(newGroup);
  } catch (err) {
    console.error('Error creating group:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/groups/:id
exports.deleteGroup = async (req, res) => {
  const { id } = req.params;
  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await group.destroy();
    return res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error('Error deleting group:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/groups/:id/members
exports.addGroupMember = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const group = await db.Group.findByPk(id);
    const user = await db.User.findByPk(userId);
    if (!group || !user) return res.status(404).json({ error: 'Group or User not found' });
    await group.addMember(user);
    return res.json({ message: 'Member added successfully' });
  } catch (err) {
    console.error('Error adding group member:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/groups/:id/members/:userId
exports.removeGroupMember = async (req, res) => {
  const { id, userId } = req.params;
  try {
    const group = await db.Group.findByPk(id);
    const user = await db.User.findByPk(userId);
    if (!group || !user) return res.status(404).json({ error: 'Group or User not found' });
    await group.removeMember(user);
    return res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Error removing group member:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/groups/:id/admins
exports.addGroupAdmin = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const group = await db.Group.findByPk(id);
    const user = await db.User.findByPk(userId);
    if (!group || !user) return res.status(404).json({ error: 'Group or User not found' });
    await group.addAdmin(user);
    return res.json({ message: 'Admin added successfully' });
  } catch (err) {
    console.error('Error adding group admin:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/groups/:id/admins/:userId
exports.removeGroupAdmin = async (req, res) => {
  const { id, userId } = req.params;
  try {
    const group = await db.Group.findByPk(id);
    const user = await db.User.findByPk(userId);
    if (!group || !user) return res.status(404).json({ error: 'Group or User not found' });
    await group.removeAdmin(user);
    return res.json({ message: 'Admin removed successfully' });
  } catch (err) {
    console.error('Error removing group admin:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/groups/my-groups
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await db.Group.findAll({
      include: [
        { model: db.User, as: 'admins' },
        { model: db.User, as: 'members' }
      ]
    });
    return res.json(groups);
  } catch (err) {
    console.error('Error fetching my groups:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
