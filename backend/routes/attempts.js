const express = require('express');
const router = express.Router();
const db = require('../src/models');
const { authMiddleware } = require('../middleware/auth');

// Get all attempts for a student
router.get('/my-attempts', authMiddleware, async (req, res) => {
    try {
        const attempts = await db.Response.findAll({
            where: { userId: req.user.id },
            include: [{ model: db.Task, as: 'task' }],
            order: [['submittedAt', 'DESC']]
        });
        res.json(attempts);
    } catch (error) {
        console.error('Fetch my attempts error:', error);
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
});

// Submit an attempt (for Listening/Reading)
router.post('/submit', authMiddleware, async (req, res) => {
    const { taskId, studentAnswers, score, aiResults } = req.body;

    if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
    }

    try {
        const attempt = await db.Response.create({
            userId: req.user.id,
            taskId,
            studentAnswers,
            score,
            aiResults,
            status: 'COMPLETED',
            submittedAt: new Date()
        });

        res.status(201).json(attempt);
    } catch (error) {
        console.error('Submit attempt error:', error);
        res.status(500).json({ error: 'Failed to submit attempt' });
    }
});

// Get attempts for a teacher's students
router.get('/student-attempts/:studentId', authMiddleware, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const requesterId = req.user.id;
        const requesterRole = req.user.role;

        if (requesterRole === 'TEACHER') {
            // Check if they share a group where the teacher is an admin/owner
            const sharedGroups = await db.Group.findAll({
                include: [
                    { model: db.User, as: 'admins', where: { id: requesterId }, attributes: [] },
                    { model: db.User, as: 'members', where: { id: studentId }, attributes: [] }
                ]
            });

            if (sharedGroups.length === 0) {
                return res.status(403).json({ error: 'Unauthorized to view this student' });
            }
        } else if (!['ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(requesterRole)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const attempts = await db.Response.findAll({
            where: { userId: studentId },
            include: [{ model: db.Task, as: 'task' }],
            order: [['submittedAt', 'DESC']]
        });
        res.json(attempts);
    } catch (error) {
        console.error('Fetch student attempts error:', error);
        res.status(500).json({ error: 'Failed to fetch student attempts' });
    }
});

// Assign a task to a student
router.post('/assign', authMiddleware, async (req, res) => {
    const { userId, taskId } = req.body;

    try {
        // Only Teachers and Admins can assign tasks
        if (req.user.role === 'STUDENT') {
            return res.status(403).json({ error: 'Unauthorized to assign tasks' });
        }

        // Check if already assigned or in progress
        const existingTask = await db.Response.findOne({
            where: {
                userId,
                taskId,
                status: ['ASSIGNED', 'IN_PROGRESS']
            }
        });

        if (existingTask) {
            return res.status(400).json({ error: 'Task already assigned or in progress for this student' });
        }

        const assignment = await db.Response.create({
            userId,
            taskId,
            status: 'ASSIGNED',
            score: null,
            submittedAt: new Date()
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ error: 'Failed to assign task' });
    }
});

module.exports = router;
