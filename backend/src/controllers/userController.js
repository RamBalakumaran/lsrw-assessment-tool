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
  
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  try {
    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const userPassword = password || '123456';
    const passwordHash = await bcrypt.hash(userPassword, 10);
    
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

// GET /api/users/:userId/performance
exports.getUserPerformance = async (req, res) => {
  const { userId } = req.params;
  try {
    const student = await db.User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'registrationNumber']
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const responses = await db.Response.findAll({
      where: { userId }
    });

    const responsesWithTasks = [];
    let totalScore = 0;
    let peak = 0;
    
    let listeningScores = [];
    let speakingScores = [];
    let readingScores = [];
    let writingScores = [];

    for (const resp of responses) {
      totalScore += resp.score || 0;
      if ((resp.score || 0) > peak) peak = resp.score;

      const task = await db.Task.findByPk(resp.taskId);
      const taskTitle = task ? task.title : 'Deleted Task';
      const lsrwComponent = task ? task.lsrwComponent : 'UNKNOWN';

      if (task) {
        if (lsrwComponent === 'LISTENING') listeningScores.push(resp.score || 0);
        if (lsrwComponent === 'SPEAKING') speakingScores.push(resp.score || 0);
        if (lsrwComponent === 'READING') readingScores.push(resp.score || 0);
        if (lsrwComponent === 'WRITING') writingScores.push(resp.score || 0);
      }

      responsesWithTasks.push({
        id: resp.id,
        taskId: resp.taskId,
        taskTitle,
        lsrwComponent,
        score: resp.score,
        feedback: resp.feedback,
        submittedAt: resp.submittedAt
      });
    }

    const totalAttempts = responses.length;
    const avg = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
    const avgList = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    return res.json({
      student,
      stats: {
        avg,
        peak,
        totalAttempts,
        skillProficiency: [
          { skill: "Speaking", val: avgList(speakingScores), color: "rose" },
          { skill: "Listening", val: avgList(listeningScores), color: "emerald" },
          { skill: "Reading", val: avgList(readingScores), color: "amber" },
          { skill: "Writing", val: avgList(writingScores), color: "indigo" }
        ]
      },
      activities: responsesWithTasks
    });

  } catch (err) {
    console.error('Error fetching student performance:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
