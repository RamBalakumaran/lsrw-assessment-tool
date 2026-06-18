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

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupIds, ...taskData } = req.body;

    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await task.update(taskData);

    if (taskData.visibilityScope === 'GroupSpecific' && groupIds) {
      await task.setTargetGroups(groupIds);
    } else if (taskData.visibilityScope !== 'GroupSpecific') {
      await task.setTargetGroups([]);
    }

    return res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await task.destroy();
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting task:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/tasks/upload-image
exports.uploadTaskImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Create absolute or relative URL. Since we serve /uploads natively:
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.json({ url: fileUrl });
  } catch (err) {
    console.error('Error uploading image:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
