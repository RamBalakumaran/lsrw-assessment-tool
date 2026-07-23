const db = require('../models');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

const USER_ATTRIBUTES = ['id', 'firstName', 'lastName', 'email', 'role', 'status'];

const groupInclude = [
  { model: db.User, as: 'admins', attributes: USER_ATTRIBUTES, through: { attributes: [] } },
  { model: db.User, as: 'members', attributes: USER_ATTRIBUTES, through: { attributes: [] } },
  { model: db.Task, as: 'tasks', through: { attributes: [] } }
];

const isPlatformAdmin = (user) => user?.role === 'ADMIN';

const getRequestedUserIds = (body, singleKey = 'userId', multiKey = 'userIds') => {
  if (Array.isArray(body[multiKey])) return body[multiKey].filter(Boolean);
  if (body[singleKey]) return [body[singleKey]];
  return [];
};

const getGroupWithDetails = (id) => db.Group.findByPk(id, { include: groupInclude });

const serializeGroup = (group) => {
  if (!group) return null;
  const data = group.toJSON();
  data.admins = data.admins || [];
  data.members = data.members || [];
  data.tasks = data.tasks || [];
  return data;
};

const userIsGroupAdmin = async (group, user) => {
  if (!group || !user) return false;
  if (isPlatformAdmin(user)) return true;
  return group.hasAdmin(user);
};

const userCanAccessGroup = (group, user) => {
  if (!group || !user) return false;
  if (isPlatformAdmin(user)) return true;
  const data = group.toJSON();
  return Boolean(
    data.admins?.some((admin) => admin.id === user.id) ||
    data.members?.some((member) => member.id === user.id)
  );
};

const ensureDefaultAdmins = async (group, creatorId) => {
  const defaultAdmins = await db.User.findAll({ where: { role: 'ADMIN' } });
  if (defaultAdmins.length > 0) {
    await group.addAdmins(defaultAdmins);
  }

  if (creatorId) {
    const creator = await db.User.findByPk(creatorId);
    if (creator) {
      await group.addAdmin(creator);
    }
  }
};

const getVisibleGroups = async (user) => {
  const groups = await db.Group.findAll({
    include: groupInclude,
    order: [['createdAt', 'DESC']]
  });

  if (isPlatformAdmin(user)) return groups;
  return groups.filter((group) => userCanAccessGroup(group, user));
};

// GET /api/groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await getVisibleGroups(req.user);
    return res.json(groups.map(serializeGroup));
  } catch (err) {
    console.error('Error fetching groups:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/groups/:id
exports.getGroupById = async (req, res) => {
  const { id } = req.params;
  try {
    const group = await getGroupWithDetails(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!userCanAccessGroup(group, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(serializeGroup(group));
  } catch (err) {
    console.error('Error fetching group by ID:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/groups
exports.createGroup = async (req, res) => {
  const { name } = req.body;
  const creatorId = req.user?.id || req.body.creatorId;

  if (!name?.trim()) return res.status(400).json({ error: 'Group name required' });

  try {
    const newGroup = await db.Group.create({ name: name.trim() });
    await ensureDefaultAdmins(newGroup, creatorId);

    const group = await getGroupWithDetails(newGroup.id);
    return res.status(201).json(serializeGroup(group));
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

    if (!(await userIsGroupAdmin(group, req.user))) {
      return res.status(403).json({ error: 'Only group admins can delete this group' });
    }

    // Clear association rows in join tables before deletion
    await group.setMembers([]);
    await group.setAdmins([]);
    await group.setTasks([]);
    await group.destroy();
    return res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error('Error deleting group:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/groups/:id
exports.updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!(await userIsGroupAdmin(group, req.user))) {
      return res.status(403).json({ error: 'Only group admins can modify this group' });
    }

    if (name !== undefined) group.name = name.trim();
    if (status !== undefined) {
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or INACTIVE.' });
      }
      group.status = status;
    }

    await group.save();
    return res.json({ message: 'Group updated successfully', group });
  } catch (err) {
    console.error('Error updating group:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/groups/:id/members
exports.addGroupMember = async (req, res) => {
  const { id } = req.params;
  const userIds = getRequestedUserIds(req.body);

  if (userIds.length === 0) {
    return res.status(400).json({ error: 'userId or userIds is required' });
  }

  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!(await userIsGroupAdmin(group, req.user))) {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }

    const users = await db.User.findAll({ where: { id: userIds } });
    if (users.length !== userIds.length) {
      return res.status(404).json({ error: 'One or more users were not found' });
    }

    await group.addMembers(users);
    const updatedGroup = await getGroupWithDetails(id);
    return res.json({ message: 'Member added successfully', group: serializeGroup(updatedGroup) });
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

    const isSelf = req.user?.id === userId;
    if (!isSelf && !(await userIsGroupAdmin(group, req.user))) {
      return res.status(403).json({ error: 'Only group admins can remove members' });
    }

    await group.removeMember(user);
    const updatedGroup = await getGroupWithDetails(id);
    return res.json({ message: 'Member removed successfully', group: serializeGroup(updatedGroup) });
  } catch (err) {
    console.error('Error removing group member:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/groups/:id/admins
exports.addGroupAdmin = async (req, res) => {
  const { id } = req.params;
  const userIds = getRequestedUserIds(req.body);

  if (userIds.length === 0) {
    return res.status(400).json({ error: 'userId or userIds is required' });
  }

  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!(await userIsGroupAdmin(group, req.user))) {
      return res.status(403).json({ error: 'Only existing group admins can add admins' });
    }

    const users = await db.User.findAll({ where: { id: userIds } });
    if (users.length !== userIds.length) {
      return res.status(404).json({ error: 'One or more users were not found' });
    }

    await group.addAdmins(users);
    const updatedGroup = await getGroupWithDetails(id);
    return res.json({ message: 'Admin added successfully', group: serializeGroup(updatedGroup) });
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
    if (!group || !user) return res.status(404).json({ error: 'Group or User not found' });

    if (req.user?.id !== userId) {
      return res.status(403).json({ error: 'Admins can only leave a group themselves' });
    }

    await group.removeAdmin(user);
    const updatedGroup = await getGroupWithDetails(id);
    return res.json({ message: 'Admin left group successfully', group: serializeGroup(updatedGroup) });
  } catch (err) {
    console.error('Error removing group admin:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/groups/my-groups
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await getVisibleGroups(req.user);
    return res.json(groups.map(serializeGroup));
  } catch (err) {
    console.error('Error fetching my groups:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/groups/:id/bulk-import/parse
exports.parseBulkImport = async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No Excel file uploaded.' });
  }

  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!(await userIsGroupAdmin(group, req.user))) {
      return res.status(403).json({ error: 'Only group admins can import members' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const students = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      // Expecting columns: registrationNumber, firstName, lastName
      const regNoKey = Object.keys(row).find(k => 
        ['registrationnumber', 'registrationno', 'regno', 'reg_no', 'rollno', 'roll_no'].includes(k.toLowerCase().trim())
      );
      const firstNameKey = Object.keys(row).find(k => 
        ['firstname', 'first_name', 'name'].includes(k.toLowerCase().trim())
      );
      const lastNameKey = Object.keys(row).find(k => 
        ['lastname', 'last_name'].includes(k.toLowerCase().trim())
      );

      const rawRegNo = regNoKey ? row[regNoKey] : null;
      const firstName = firstNameKey ? row[firstNameKey] : null;
      const lastName = lastNameKey ? row[lastNameKey] : '';

      if (!rawRegNo) {
        errors.push({ row: rowNum, error: 'Missing registration number column' });
        continue;
      }

      const registrationNumber = String(rawRegNo).trim();
      const email = `${registrationNumber.toLowerCase()}@nec.edu.in`;

      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: { email }
      });

      students.push({
        registrationNumber,
        firstName: firstName ? String(firstName).trim() : 'Student',
        lastName: lastName ? String(lastName).trim() : registrationNumber,
        email,
        exists: !!existingUser
      });
    }

    return res.json({ students, errors });
  } catch (err) {
    console.error('Error parsing bulk import:', err);
    return res.status(500).json({ error: 'Failed to parse Excel file.' });
  }
};

// POST /api/groups/:id/bulk-import/confirm
exports.confirmBulkImport = async (req, res) => {
  const { id } = req.params;
  const { students } = req.body;

  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ error: 'Students list required.' });
  }

  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!(await userIsGroupAdmin(group, req.user))) {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }

    const defaultPassword = '123456';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const success = [];
    const errors = [];

    for (const studentData of students) {
      try {
        const { registrationNumber, firstName, lastName, email } = studentData;

        if (!registrationNumber) {
          throw new Error('Registration number is required.');
        }

        const normalizedEmail = email || `${registrationNumber.toLowerCase().trim()}@nec.edu.in`;

        // Check if user exists
        let user = await db.User.findOne({
          where: { email: normalizedEmail }
        });

        if (!user) {
          // Create new user
          user = await db.User.create({
            firstName: firstName || 'Student',
            lastName: lastName || registrationNumber,
            email: normalizedEmail,
            passwordHash,
            role: 'STUDENT',
            registrationNumber: registrationNumber.trim(),
            status: 'ACTIVE',
            forcePasswordReset: true
          });
        } else {
          // Update registration number if not present
          if (!user.registrationNumber) {
            await user.update({ registrationNumber: registrationNumber.trim() });
          }
        }

        // Add user as member of the group
        const isMember = await group.hasMember(user);
        if (!isMember) {
          await group.addMember(user);
        }

        success.push({
          email: user.email,
          registrationNumber: user.registrationNumber,
          isNew: !studentData.exists
        });
      } catch (err) {
        errors.push({
          registrationNumber: studentData.registrationNumber,
          error: err.message
        });
      }
    }

    const updatedGroup = await getGroupWithDetails(id);
    return res.json({
      success,
      errors,
      group: serializeGroup(updatedGroup)
    });
  } catch (err) {
    console.error('Error confirming bulk import:', err);
    return res.status(500).json({ error: 'Server error during import confirmation' });
  }
};

// POST /api/groups/:id/tasks/:taskId
exports.assignTaskToGroup = async (req, res) => {
  const { id, taskId } = req.params;
  try {
    const group = await db.Group.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!userCanAccessGroup(group, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await db.Task.findByPk(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await group.addTask(task);

    const updatedGroup = await getGroupWithDetails(id);
    return res.json(serializeGroup(updatedGroup));
  } catch (err) {
    console.error('Error assigning task to group:', err);
    return res.status(500).json({ error: 'Server error assigning task to group' });
  }
};
