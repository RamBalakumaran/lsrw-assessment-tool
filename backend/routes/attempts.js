const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authMiddleware } = require('../middleware/auth');

// Get all attempts for a student
router.get('/my-attempts', authMiddleware, async (req, res) => {
    try {
        const attempts = await prisma.attempt.findMany({
            where: { userId: req.user.id },
            include: { task: true },
            orderBy: { submittedAt: 'desc' }
        });
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
});

// Submit an attempt (for Listening/Reading)
router.post('/submit', authMiddleware, async (req, res) => {
    const { taskId, studentAnswers, score, aiResults } = req.body;

    try {
        const attempt = await prisma.attempt.create({
            data: {
                userId: req.user.id,
                taskId,
                studentAnswers,
                score,
                aiResults,
                status: 'COMPLETED'
            }
        });

        // Update progress summary (simplified logic)
        await prisma.studentProgressSummary.upsert({
            where: { userId: req.user.id },
            update: {
                totalAttempts: { increment: 1 },
                lastAttemptAt: new Date()
            },
            create: {
                userId: req.user.id,
                totalAttempts: 1,
                lastAttemptAt: new Date()
            }
        });

        res.status(201).json(attempt);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit attempt' });
    }
});

// Get attempts for a teacher's students
router.get('/student-attempts/:studentId', authMiddleware, async (req, res) => {
    try {
        // Teachers can see their students' attempts
        if (req.user.role === 'TEACHER') {
            const student = await prisma.user.findFirst({
                where: { id: req.params.studentId, teacherId: req.user.id }
            });
            if (!student) return res.status(403).json({ error: 'Unauthorized to view this student' });
        } else if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const attempts = await prisma.attempt.findMany({
            where: { userId: req.params.studentId },
            include: { task: true },
            orderBy: { submittedAt: 'desc' }
        });
        res.json(attempts);
    } catch (error) {
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
        const existingTask = await prisma.attempt.findFirst({
            where: {
                userId,
                taskId,
                status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
            }
        });

        if (existingTask) {
            return res.status(400).json({ error: 'Task already assigned or in progress for this student' });
        }

        const assignment = await prisma.attempt.create({
            data: {
                userId,
                taskId,
                status: 'ASSIGNED',
                score: null
            }
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to assign task' });
    }
});

module.exports = router;
