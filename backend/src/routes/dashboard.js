const express = require('express');
const router = express.Router();
const db = require('../models');
const { authMiddleware } = require('../../middleware/auth');

// GET /api/dashboard/student
router.get('/student', authMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await db.User.findByPk(studentId, {
            include: [{ model: db.Group, as: 'groupMemberships' }]
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get student's group IDs
        const groupIds = student.groupMemberships.map(g => g.id);

        // Fetch Global tasks and Group tasks
        let assignedTasks = [];
        if (groupIds.length > 0) {
            assignedTasks = await db.Task.findAll({
                include: [
                    {
                        model: db.Group,
                        as: 'targetGroups',
                        where: { id: groupIds },
                        attributes: []
                    }
                ]
            });
        }

        const globalTasks = await db.Task.findAll({
            where: { visibilityScope: 'Global' }
        });

        // Combine and format tasks for the dashboard
        const allRelevantTasks = [...assignedTasks, ...globalTasks].filter((task, index, self) =>
            index === self.findIndex((t) => t.id === task.id)
        );

        const formattedAssignedTasks = allRelevantTasks.map(t => ({
            id: t.id,
            task: t,
            dueDate: t.endDate
        }));

        const stats = [
            { label: 'Skill Average', value: '78%', trend: '+4%' },
            { label: 'Completed', value: '12', trend: '+2' },
            { label: 'Global Rank', value: 'top 15%', trend: 'Up' },
            { label: 'Daily Streak', value: '5 days', trend: 'Fire' }
        ];

        res.json({
            user: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                plan: "Standard Plan"
            },
            groups: student.groupMemberships,
            stats,
            assignedTasks: formattedAssignedTasks
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: "Failed to load dashboard" });
    }
});

// GET /api/dashboard/teacher
router.get('/teacher', authMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.id;

        // Find all groups where the teacher is an admin/owner
        const teacherGroups = await db.Group.findAll({
            include: [{
                model: db.User,
                as: 'admins',
                where: { id: teacherId },
                attributes: []
            }],
            attributes: ['id']
        });
        const groupIds = teacherGroups.map(g => g.id);

        // Fetch all student users who are members of those groups or directly assigned to this teacher
        const students = await db.User.findAll({
            where: { role: 'STUDENT' },
            include: [
                {
                    model: db.Group,
                    as: 'groupMemberships',
                    where: groupIds.length > 0 ? { id: groupIds } : { id: null },
                    attributes: ['id', 'name'],
                    required: true
                },
                {
                    model: db.Response,
                    as: 'responses',
                    include: [{ model: db.Task, as: 'task' }]
                }
            ]
        });

        const totalTasks = await db.Task.count();

        // Format the students to include their attempts (responses mapped to attempts format)
        const formattedStudents = students.map(s => {
            const attempts = (s.responses || []).map(r => ({
                id: r.id,
                score: r.score,
                submittedAt: r.submittedAt,
                status: 'COMPLETED',
                task: r.task
            })).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

            // Calculate skill-wise average scores for progressSummary representation
            const listeningAttempts = attempts.filter(att => att.task?.lsrwComponent === 'Listening');
            const speakingAttempts = attempts.filter(att => att.task?.lsrwComponent === 'Speaking');
            const readingAttempts = attempts.filter(att => att.task?.lsrwComponent === 'Reading');
            const writingAttempts = attempts.filter(att => att.task?.lsrwComponent === 'Writing');

            const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((acc, curr) => acc + (curr.score || 0), 0) / arr.length) : 0;

            const progressSummary = {
                listeningAvg: avg(listeningAttempts),
                speakingAvg: avg(speakingAttempts),
                readingAvg: avg(readingAttempts),
                writingAvg: avg(writingAttempts)
            };

            return {
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                email: s.email,
                status: s.status,
                progressSummary,
                attempts
            };
        });

        // Calculate pendingReports: count students with average score < 50
        const pendingReports = formattedStudents.filter(s => {
            const summary = s.progressSummary;
            const avgScore = (summary.listeningAvg + summary.speakingAvg + summary.readingAvg + summary.writingAvg) / 4;
            return avgScore < 50 && s.attempts.length > 0;
        }).length;

        res.json({
            studentCount: formattedStudents.length,
            students: formattedStudents,
            tasksAssigned: totalTasks,
            pendingReports
        });
    } catch (error) {
        console.error("Teacher dashboard error:", error);
        res.status(500).json({ error: "Failed to load teacher dashboard" });
    }
});

module.exports = router;
