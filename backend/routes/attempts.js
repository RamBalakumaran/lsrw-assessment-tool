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

// Get media progress for a task
router.get('/media-progress/:taskId', authMiddleware, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;

        const response = await db.Response.findOne({
            where: { userId, taskId }
        });

        if (!response) {
            return res.json({ progress: 0, unlocked: false });
        }

        res.json({
            progress: response.mediaProgress || 0,
            unlocked: Boolean(response.mediaUnlocked)
        });
    } catch (error) {
        console.error('Fetch media progress error:', error);
        res.status(500).json({ error: 'Failed to fetch media progress' });
    }
});

// Update media progress for a task
router.post('/media-progress', authMiddleware, async (req, res) => {
    try {
        const { taskId, watchedTime, totalDuration } = req.body;
        const userId = req.user.id;

        if (!taskId || totalDuration === undefined || totalDuration <= 0) {
            return res.status(400).json({ error: 'Valid taskId and totalDuration are required' });
        }

        const calculatedProgress = Math.min(100, Math.max(0, (watchedTime / totalDuration) * 100));
        const isUnlocked = calculatedProgress >= 50;

        let [response, created] = await db.Response.findOrCreate({
            where: { userId, taskId },
            defaults: {
                userId,
                taskId,
                status: 'IN_PROGRESS',
                mediaProgress: calculatedProgress,
                mediaUnlocked: isUnlocked,
                submittedAt: new Date()
            }
        });

        if (!created) {
            const newProgress = Math.max(response.mediaProgress || 0, calculatedProgress);
            const newUnlocked = response.mediaUnlocked || isUnlocked;

            await response.update({
                mediaProgress: newProgress,
                mediaUnlocked: newUnlocked
            });
        }

        res.json({
            progress: Math.max(response.mediaProgress || 0, calculatedProgress),
            unlocked: response.mediaUnlocked || isUnlocked
        });
    } catch (error) {
        console.error('Update media progress error:', error);
        res.status(500).json({ error: 'Failed to update media progress' });
    }
});

// Submit an attempt (for Listening/Reading)
router.post('/submit', authMiddleware, async (req, res) => {
    const { taskId, studentAnswers, score, aiResults } = req.body;

    if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
    }

    try {
        // Validate media completion requirement if task has media
        const task = await db.Task.findByPk(taskId);
        if (task && task.audioUrl) {
            const existingProgress = await db.Response.findOne({
                where: { userId: req.user.id, taskId }
            });
            if (!existingProgress || (!existingProgress.mediaUnlocked && (existingProgress.mediaProgress || 0) < 50)) {
                return res.status(403).json({ error: 'Please complete at least 50% of the learning content before submitting.' });
            }
        }

        const existingAttempt = await db.Response.findOne({
            where: { userId: req.user.id, taskId }
        });

        let attempt;
        if (existingAttempt) {
            attempt = await existingAttempt.update({
                studentAnswers,
                answer: studentAnswers ? JSON.stringify(studentAnswers) : "",
                score,
                aiResults,
                feedback: aiResults ? (typeof aiResults === 'string' ? aiResults : JSON.stringify(aiResults)) : "",
                recordingUrl: req.body.recordingUrl,
                status: 'COMPLETED',
                submittedAt: new Date()
            });
        } else {
            attempt = await db.Response.create({
                userId: req.user.id,
                taskId,
                studentAnswers,
                answer: studentAnswers ? JSON.stringify(studentAnswers) : "",
                score,
                aiResults,
                feedback: aiResults ? (typeof aiResults === 'string' ? aiResults : JSON.stringify(aiResults)) : "",
                recordingUrl: req.body.recordingUrl,
                status: 'COMPLETED',
                submittedAt: new Date()
            });
        }
        
        const { notifyUser } = require('../utils/notify');
        const timestamp = new Date().toLocaleString();
        
        let detailedReportHtml = "";
        if (aiResults && aiResults.recommendations) {
            detailedReportHtml = `<div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                <h3 style="color: #4f46e5; margin-top: 0;">Detailed AI Analysis</h3>
                <p><strong>Feedback:</strong></p>
                <ul>
                    ${aiResults.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>`;
        }
        
        // Notify the student
        await notifyUser({
            userId: req.user.id,
            title: 'Task Completed',
            message: `You have successfully completed ${task ? `'${task.title}'` : 'the task'}.<br/>Completion Time: ${timestamp}<br/><strong>Score: ${score !== undefined ? score : 'N/A'}</strong><br/>${detailedReportHtml}`,
            type: 'SUCCESS'
        });

        // Notify the teacher (creator of the task)
        if (task && task.creatorId) {
            await notifyUser({
                userId: task.creatorId,
                title: 'Student Completed Task',
                message: `A student has completed the task '${task.title}' at ${timestamp}.`,
                type: 'INFO',
                link: `/admin/responses/${attempt.id}`
            });
        }

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
