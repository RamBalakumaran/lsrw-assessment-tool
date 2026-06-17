// src/controllers/taskController.js
const db = require('../models');

// GET /api/tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await db.Task.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { groupIds, ...taskData } = req.body;
    
    // In production, creatorId would be req.user.id. Mocking for now if not provided.
    if (!taskData.creatorId) {
      const firstAdmin = await db.User.findOne({ where: { role: 'ADMIN' }});
      taskData.creatorId = firstAdmin ? firstAdmin.id : '00000000-0000-0000-0000-000000000000';
    }

    const task = await db.Task.create(taskData);

    if (taskData.visibilityScope === 'GroupSpecific' && groupIds && groupIds.length > 0) {
      await task.setTargetGroups(groupIds);
    }

    return res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
