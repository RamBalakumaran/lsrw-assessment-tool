// src/controllers/taskController.js
const db = require('../models');

// GET /api/tasks
exports.getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let tasks;
    
    if (userRole === 'STUDENT') {
      // Students see Global tasks or tasks assigned to groups they are members of
      const studentGroups = await db.Group.findAll({
        include: [{
          model: db.User,
          as: 'members',
          where: { id: userId },
          attributes: []
        }],
        attributes: ['id']
      });
      const groupIds = studentGroups.map(g => g.id);
      
      tasks = await db.Task.findAll({
        where: { status: 'Published' },
        include: [
          {
            model: db.Group,
            as: 'targetGroups',
            required: false
          },
          {
            model: db.User,
            as: 'creator',
            attributes: ['id', 'role']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      tasks = tasks.filter(task => {
        if (task.visibilityScope === 'Global') return true;
        if (task.visibilityScope === 'GroupSpecific') {
          return task.targetGroups && task.targetGroups.some(g => groupIds.includes(g.id));
        }
        return false;
      });
      
    } else if (userRole === 'TEACHER') {
      // Teachers see tasks they created, Global tasks, or tasks assigned to groups they administer
      const teacherGroups = await db.Group.findAll({
        include: [{
          model: db.User,
          as: 'admins',
          where: { id: userId },
          attributes: []
        }],
        attributes: ['id']
      });
      const groupIds = teacherGroups.map(g => g.id);
      
      tasks = await db.Task.findAll({
        include: [
          {
            model: db.Group,
            as: 'targetGroups',
            required: false
          },
          {
            model: db.User,
            as: 'creator',
            attributes: ['id', 'role']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      tasks = tasks.filter(task => {
        if (task.creatorId === userId) return true;
        if (task.visibilityScope === 'Global') return true;
        if (task.visibilityScope === 'GroupSpecific') {
          return task.targetGroups && task.targetGroups.some(g => groupIds.includes(g.id));
        }
        return false;
      });
      
    } else {
      // ADMIN or SUPER_ADMIN sees all tasks
      tasks = await db.Task.findAll({
        include: [
          {
            model: db.Group,
            as: 'targetGroups',
            required: false
          },
          {
            model: db.User,
            as: 'creator',
            attributes: ['id', 'role']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }
    
    const formattedTasks = tasks.map(t => {
      const tJson = typeof t.toJSON === 'function' ? t.toJSON() : t;
      tJson.createdByRole = t.creator ? t.creator.role : (t.createdByRole || 'TEACHER');
      tJson.groupIds = t.targetGroups ? t.targetGroups.map(g => g.id) : [];
      return tJson;
    });
    return res.json(formattedTasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { groupIds, ...taskData } = req.body;
    
    // Set creatorId to the logged-in user's id
    taskData.creatorId = req.user.id;

    const task = await db.Task.create(taskData);

    if (taskData.visibilityScope === 'GroupSpecific' && groupIds && groupIds.length > 0) {
      await task.setTargetGroups(groupIds);
    }

    const taskJson = task.toJSON();
    taskJson.groupIds = taskData.visibilityScope === 'GroupSpecific' ? (groupIds || []) : [];
    taskJson.createdByRole = req.user.role;

    return res.status(201).json(taskJson);
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

    // Auth check: only the creator of the task or an ADMIN/SUPER_ADMIN can modify it
    if (task.creatorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only the task creator or an administrator can modify this task' });
    }

    await task.update(taskData);

    if (taskData.visibilityScope === 'GroupSpecific' && groupIds) {
      await task.setTargetGroups(groupIds);
    } else if (taskData.visibilityScope !== 'GroupSpecific' && taskData.visibilityScope) {
      await task.setTargetGroups([]);
    }

    const taskJson = task.toJSON();
    taskJson.groupIds = taskData.visibilityScope === 'GroupSpecific' ? (groupIds || []) : [];
    const creator = await db.User.findByPk(task.creatorId);
    taskJson.createdByRole = creator ? creator.role : 'TEACHER';

    return res.json(taskJson);
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

    // Auth check: only the creator of the task or an ADMIN/SUPER_ADMIN can delete it
    if (task.creatorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only the task creator or an administrator can delete this task' });
    }

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
