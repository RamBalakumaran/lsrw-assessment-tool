const express = require('express');
const router = express.Router();
const db = require('../models');

// GET /api/dashboard/student
router.get('/student', async (req, res) => {
    try {
        // Mock retrieving student from request header or token
        // Let's assume we find the first student for now if not authenticated.
        let studentId = req.headers['x-user-id']; 
        let student;
        if (studentId) {
            student = await db.User.findByPk(studentId, {
                include: [{ model: db.Group, as: 'groupMemberships' }]
            });
        } else {
            student = await db.User.findOne({
                where: { role: 'STUDENT' },
                include: [{ model: db.Group, as: 'groupMemberships' }]
            });
        }

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

module.exports = router;
