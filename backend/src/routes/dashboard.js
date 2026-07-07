const express = require('express');
const router = express.Router();
const db = require('../models');
const { authMiddleware } = require('../../middleware/auth');
const { Sequelize } = require('../models');

// GET /api/dashboard/teacher
router.get('/teacher', authMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.id;

        // 1. Get all groups administered by this teacher
        const administeredGroups = await db.Group.findAll({
            include: [{
                model: db.User,
                as: 'admins',
                where: { id: teacherId },
                attributes: []
            }]
        });

        const groupIds = administeredGroups.map(g => g.id);

        if (groupIds.length === 0) {
            return res.json({
                studentCount: 0,
                students: [],
                tasksAssigned: 0,
                pendingReports: 0,
                groupsCount: 0,
                groupActivities: []
            });
        }

        // 2. Get all student members of these groups
        const studentUsers = await db.User.findAll({
            where: { role: 'STUDENT', status: 'ACTIVE' },
            include: [{
                model: db.Group,
                as: 'groupMemberships',
                where: { id: groupIds },
                attributes: ['id', 'name']
            }]
        });

        // Deduplicate students (in case they are in multiple groups)
        const uniqueStudentsMap = {};
        studentUsers.forEach(u => {
            uniqueStudentsMap[u.id] = u;
        });
        const uniqueStudents = Object.values(uniqueStudentsMap);

        // 3. For each student, fetch their responses/attempts
        const studentsData = [];
        let pendingReports = 0;

        for (const student of uniqueStudents) {
            const responses = await db.Response.findAll({
                where: { userId: student.id },
                order: [['submittedAt', 'DESC']],
                limit: 5
            });

            // Get task details for attempts
            const attempts = [];
            let totalScore = 0;
            let speakingScores = [], listeningScores = [], readingScores = [], writingScores = [];

            for (const r of responses) {
                const task = await db.Task.findByPk(r.taskId);
                const taskTitle = task ? task.title : 'Deleted Task';
                const taskType = task ? (task.lsrwComponent || task.type || '').toUpperCase() : 'UNKNOWN';
                const scoreVal = r.score || 0;

                attempts.push({
                    id: r.id,
                    score: scoreVal,
                    submittedAt: r.submittedAt,
                    status: 'COMPLETED',
                    task: { title: taskTitle, type: taskType }
                });

                if (task) {
                    if (taskType === 'SPEAKING') speakingScores.push(scoreVal);
                    if (taskType === 'LISTENING') listeningScores.push(scoreVal);
                    if (taskType === 'READING') readingScores.push(scoreVal);
                    if (taskType === 'WRITING') writingScores.push(scoreVal);
                    totalScore += scoreVal;
                }
            }

            const avgList = (arr) => arr.length > 0 ? Math.round(arr.reduce((a,b)=>a+b, 0)/arr.length) : 0;

            const progressSummary = {
                speakingAvg: avgList(speakingScores),
                listeningAvg: avgList(listeningScores),
                readingAvg: avgList(readingScores),
                writingAvg: avgList(writingScores)
            };

            const overallAvg = responses.length > 0 ? Math.round(totalScore / responses.length) : 0;
            if (overallAvg < 50 && responses.length > 0) {
                pendingReports++;
            }

            studentsData.push({
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                status: student.status,
                progressSummary,
                attempts
            });
        }

        const tasksAssigned = await db.Task.count();

        // 4. Group Activities and Performance
        const groupActivities = [];
        for (const group of administeredGroups) {
            const groupStudents = await db.User.findAll({
                include: [{
                    model: db.Group,
                    as: 'groupMemberships',
                    where: { id: group.id },
                    attributes: []
                }],
                where: { role: 'STUDENT' }
            });

            const studentIds = groupStudents.map(s => s.id);
            let avgScore = 0;
            let attemptsCount = 0;

            if (studentIds.length > 0) {
                attemptsCount = await db.Response.count({
                    where: { userId: studentIds }
                });
                const sumScore = await db.Response.sum('score', {
                    where: { userId: studentIds }
                }) || 0;
                avgScore = attemptsCount > 0 ? Math.round(sumScore / attemptsCount) : 0;
            }

            groupActivities.push({
                id: group.id,
                name: group.name,
                studentsCount: studentIds.length,
                attemptsCount,
                avgScore
            });
        }

        res.json({
            studentCount: uniqueStudents.length,
            students: studentsData,
            tasksAssigned,
            pendingReports,
            groupsCount: administeredGroups.length,
            groupActivities
        });

    } catch (error) {
        console.error("Teacher dashboard error:", error);
        res.status(500).json({ error: "Failed to load teacher dashboard" });
    }
});

// GET /api/dashboard/admin
router.get('/admin', authMiddleware, async (req, res) => {
    try {
        // 1. Core KPIs
        const totalStudents = await db.User.count({ where: { role: 'STUDENT' } });
        const totalTeachers = await db.User.count({ where: { role: 'TEACHER' } });
        const totalGroups = await db.Group.count();
        const totalTasks = await db.Task.count();
        const totalAttempts = await db.Response.count();

        // 2. Skill Metrics
        const allResponses = await db.Response.findAll({
            include: [{
                model: db.Task,
                attributes: ['lsrwComponent']
            }]
        });

        let listeningSum = 0, listeningCount = 0;
        let speakingSum = 0, speakingCount = 0;
        let readingSum = 0, readingCount = 0;
        let writingSum = 0, writingCount = 0;

        allResponses.forEach(r => {
            const component = r.Task ? (r.Task.lsrwComponent || '').toLowerCase() : '';
            const score = r.score || 0;
            if (component === 'listening') { listeningSum += score; listeningCount++; }
            if (component === 'speaking') { speakingSum += score; speakingCount++; }
            if (component === 'reading') { readingSum += score; readingCount++; }
            if (component === 'writing') { writingSum += score; writingCount++; }
        });

        const skillStats = {
            listening: listeningCount > 0 ? Math.round(listeningSum / listeningCount) : 0,
            speaking: speakingCount > 0 ? Math.round(speakingSum / speakingCount) : 0,
            reading: readingCount > 0 ? Math.round(readingSum / readingCount) : 0,
            writing: writingCount > 0 ? Math.round(writingSum / writingCount) : 0
        };

        // 3. User Growth (last 6 months)
        const growthData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthLabel = date.toLocaleString('default', { month: 'short' });
            
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const count = await db.User.count({
                where: {
                    createdAt: {
                        [Sequelize.Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            growthData.push({ month: monthLabel, users: count });
        }

        // 4. Leaderboards & Activity logs
        const topStudents = await db.Response.findAll({
            attributes: [
                'userId',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'attemptsCount'],
                [Sequelize.fn('AVG', Sequelize.col('score')), 'avgScore']
            ],
            group: ['userId'],
            order: [[Sequelize.literal('attemptsCount'), 'DESC']],
            limit: 5
        });

        const topActiveStudents = [];
        for (const item of topStudents) {
            const user = await db.User.findByPk(item.userId);
            if (user) {
                topActiveStudents.push({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    attemptsCount: parseInt(item.getDataValue('attemptsCount')),
                    avgScore: Math.round(parseFloat(item.getDataValue('avgScore')) || 0)
                });
            }
        }

        const teachers = await db.User.findAll({ where: { role: 'TEACHER' } });
        const teacherActivity = [];
        for (const t of teachers) {
            const groupsCount = await db.Group.count({
                include: [{
                    model: db.User,
                    as: 'admins',
                    where: { id: t.id }
                }]
            });

            const tasksCreated = await db.Task.count({ where: { creatorId: t.id } });

            teacherActivity.push({
                id: t.id,
                name: `${t.firstName} ${t.lastName}`,
                email: t.email,
                groupsCount,
                tasksCreated
            });
        }

        const groups = await db.Group.findAll({ limit: 5 });
        const groupProgress = [];
        for (const g of groups) {
            const groupStudents = await db.User.findAll({
                include: [{
                    model: db.Group,
                    as: 'groupMemberships',
                    where: { id: g.id }
                }],
                where: { role: 'STUDENT' }
            });

            const studentIds = groupStudents.map(s => s.id);
            let submissionsCount = 0;
            let averageScore = 0;

            if (studentIds.length > 0) {
                submissionsCount = await db.Response.count({
                    where: { userId: studentIds }
                });
                const sumScore = await db.Response.sum('score', {
                    where: { userId: studentIds }
                }) || 0;
                averageScore = submissionsCount > 0 ? Math.round(sumScore / submissionsCount) : 0;
            }

            groupProgress.push({
                id: g.id,
                name: g.name,
                studentsCount: groupStudents.length,
                submissionsCount,
                averageScore
            });
        }

        res.json({
            totalStudents,
            totalTeachers,
            totalGroups,
            totalTasks,
            totalAttempts,
            skillStats,
            growthData,
            topActiveStudents,
            teacherActivity,
            groupProgress
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);
        res.status(500).json({ error: "Failed to load admin dashboard: " + error.message });
    }
});

// GET /api/dashboard/student
router.get('/student', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch User and group memberships
        const user = await db.User.findByPk(userId, {
            include: [{ 
                model: db.Group, 
                as: 'groupMemberships',
                where: { status: 'ACTIVE' },
                required: false
            }]
        });

        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Fetch all responses/attempts by this student
        const userResponses = await db.Response.findAll({
            where: { userId }
        });

        // 1. Calculate Skill Average
        const totalScore = userResponses.reduce((sum, r) => sum + (r.score || 0), 0);
        const completedCount = userResponses.length;
        const skillAvg = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;

        // 2. Calculate Global Rank based on true student average comparisons
        const allStudents = await db.User.findAll({
            where: { role: 'STUDENT', status: 'ACTIVE' }
        });

        const studentAverages = [];
        for (const s of allStudents) {
            const sResponses = await db.Response.findAll({
                where: { userId: s.id }
            });
            const sTotal = sResponses.reduce((sum, r) => sum + (r.score || 0), 0);
            const sAvg = sResponses.length > 0 ? (sTotal / sResponses.length) : 0;
            studentAverages.push({ id: s.id, avg: sAvg });
        }

        // Sort averages descending
        studentAverages.sort((a, b) => b.avg - a.avg);

        // Find current user's rank index (1-based)
        const rankIndex = studentAverages.findIndex(item => item.id === userId) + 1;
        const totalRankStudents = studentAverages.length;

        // 3. Calculate Daily Streak based on unique submission dates
        const submissionDates = userResponses
            .map(r => {
                try {
                    return new Date(r.submittedAt).toISOString().split('T')[0];
                } catch(e) {
                    return new Date().toISOString().split('T')[0];
                }
            });
        
        const uniqueSortedDates = [...new Set(submissionDates)].sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        if (uniqueSortedDates.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (uniqueSortedDates[0] === todayStr || uniqueSortedDates[0] === yesterdayStr) {
                streak = 1;
                for (let i = 0; i < uniqueSortedDates.length - 1; i++) {
                    const current = new Date(uniqueSortedDates[i]);
                    const next = new Date(uniqueSortedDates[i + 1]);
                    const diffTime = Math.abs(current - next);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }

        const stats = [
            { label: 'Skill Average', value: `${skillAvg}%`, trend: completedCount > 0 ? '+Active' : 'No Data' },
            { label: 'Completed', value: String(completedCount), trend: 'Attempts' },
            { label: 'Global Rank', value: `Rank #${rankIndex} of ${totalRankStudents}`, trend: 'Institutional' },
            { label: 'Daily Streak', value: `${streak} ${streak === 1 ? 'Day' : 'Days'}`, trend: streak > 0 ? 'Fire' : 'Inactive' }
        ];

        // Fetch Global tasks and Group tasks (only Published ones)
        const groupIds = user.groupMemberships.map(g => g.id);

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

        // Combine and filter out tasks that are already completed by the student
        const allRelevantTasks = [...assignedTasks, ...globalTasks].filter((task, index, self) =>
            index === self.findIndex((t) => t.id === task.id)
        );

        // Filter out completed tasks so they only see tasks they haven't submitted yet
        const pendingTasks = allRelevantTasks.filter(task => 
            !userResponses.some(r => r.taskId === task.id)
        );

        const formattedAssignedTasks = pendingTasks.map(t => ({
            id: t.id,
            task: t,
            dueDate: t.endDate
        }));

        res.json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                plan: "NEC Standard"
            },
            groups: user.groupMemberships,
            stats,
            assignedTasks: formattedAssignedTasks
        });

    } catch (error) {
        console.error("Student dashboard error:", error);
        res.status(500).json({ error: "Failed to load student dashboard: " + error.message });
    }
});

module.exports = router;
