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
  const { name, creatorId } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });
  try {
    const newGroup = await db.Group.create({ name });
    
    // Add the creator
    if (creatorId) {
      const user = await db.User.findByPk(creatorId);
      if (user) await newGroup.addAdmin(user);
    }
    
    // Automatically add all admins to the group
    const systemAdmins = await db.User.findAll({ where: { role: 'ADMIN' } });
    if (systemAdmins.length > 0) {
      await newGroup.addAdmins(systemAdmins);
    }
    
    // Fetch the updated group with its associations for the return payload
    const createdGroup = await db.Group.findByPk(newGroup.id, {
      include: [
        { model: db.User, as: 'admins', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] },
        { model: db.User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] }
      ]
    });
    
    return res.status(201).json(createdGroup);
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
  const { userId, userIds } = req.body;
  
  let idsToProcess = [];
  if (userId) {
    idsToProcess.push(userId);
  } else if (Array.isArray(userIds)) {
    idsToProcess = userIds;
  }
  
  if (idsToProcess.length === 0) {
    return res.status(400).json({ error: 'User ID or User IDs array is required' });
  }
  
  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    const users = await db.User.findAll({ where: { id: idsToProcess } });
    if (users.length === 0) return res.status(404).json({ error: 'No valid Users found' });
    
    await group.addMembers(users);
    return res.json({ message: 'Member(s) added successfully' });
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
  const requesterId = req.user.id;
  try {
    const group = await db.Group.findByPk(id, {
      include: [{ model: db.User, as: 'admins', attributes: ['id'] }]
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    // Enforce "add by group admins who already present"
    const isRequesterGroupAdmin = group.admins.some(admin => admin.id === requesterId);
    if (!isRequesterGroupAdmin) {
      return res.status(403).json({ error: 'Only admins already in the group can add other admins' });
    }

    const user = await db.User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User to add not found' });
    
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
  const requesterId = req.user.id;
  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    const user = await db.User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Enforce "if no can remove admin from grp if admin wants to leave can leave if he want"
    if (user.role === 'ADMIN' && requesterId !== userId) {
      return res.status(403).json({ error: 'Only the administrator themselves can choose to leave the group' });
    }

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
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let groups;
    if (userRole === 'ADMIN') {
      groups = await db.Group.findAll({
        include: [
          { model: db.User, as: 'admins', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] },
          { model: db.User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] }
        ]
      });
    } else {
      groups = await db.Group.findAll({
        include: [
          { model: db.User, as: 'admins', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] },
          { model: db.User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] }
        ]
      });
      
      groups = groups.filter(g => 
        g.admins.some(a => a.id === userId) || 
        g.members.some(m => m.id === userId)
      );
    }
    
    return res.json(groups);
  } catch (err) {
    console.error('Error fetching my groups:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
