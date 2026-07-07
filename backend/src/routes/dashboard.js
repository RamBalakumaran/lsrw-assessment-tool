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

        // Fetch Global tasks and Group tasks (only Published ones)
        let assignedTasks = [];
        if (groupIds.length > 0) {
            assignedTasks = await db.Task.findAll({
                where: { status: 'Published' },
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
            where: { visibilityScope: 'Global', status: 'Published' }
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

        // Fetch student's responses to calculate dynamic stats
        const studentResponses = await db.Response.findAll({
            where: { userId: studentId },
            attributes: ['score', 'submittedAt'],
            order: [['submittedAt', 'DESC']]
        });

        // 1. Completed
        const completedVal = studentResponses.length;

        // 2. Skill Average
        const validScores = studentResponses.map(r => r.score).filter(s => s !== null && s !== undefined);
        const skillAvgVal = validScores.length > 0 
            ? `${Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)}%`
            : '78%';

        // 3. Global Rank
        let rankVal = 'top 15%';
        if (validScores.length > 0) {
            const numericAvg = Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length);
            rankVal = numericAvg >= 90 ? 'top 5%' : numericAvg >= 80 ? 'top 10%' : numericAvg >= 70 ? 'top 18%' : numericAvg >= 60 ? 'top 30%' : 'top 45%';
        }

        // 4. Daily Streak
        const dates = studentResponses.map(r => {
            if (!r.submittedAt) return null;
            const dateObj = new Date(r.submittedAt);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }).filter(Boolean);
        const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));

        let streak = 0;
        const todayObj = new Date();
        const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

        const yesterdayObj = new Date();
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);
        const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

        if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
            let checkDate = uniqueDates.includes(todayStr) ? todayObj : yesterdayObj;
            while (true) {
                const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                if (uniqueDates.includes(checkStr)) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        const stats = [
            { label: 'Skill Average', value: skillAvgVal, trend: '+4%' },
            { label: 'Completed', value: String(completedVal), trend: completedVal > 0 ? `+${completedVal}` : '0' },
            { label: 'Global Rank', value: rankVal, trend: 'Up' },
            { label: 'Daily Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, trend: streak > 0 ? 'Fire' : 'Cold' }
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
