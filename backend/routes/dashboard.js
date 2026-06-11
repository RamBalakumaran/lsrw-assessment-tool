const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authMiddleware, authorize } = require('../middleware/auth');

// Admin Dashboard Stats
router.get('/admin', authMiddleware, authorize(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    try {
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const orgId = req.user.organizationId;
        const studentWhere = isSuperAdmin ? { role: 'STUDENT' } : { organizationId: orgId, role: 'STUDENT' };
        const teacherWhere = isSuperAdmin ? { role: 'TEACHER' } : { organizationId: orgId, role: 'TEACHER' };
        const taskWhere = isSuperAdmin ? {} : { organizationId: orgId };
        const attemptUserWhere = isSuperAdmin ? {} : { organizationId: orgId };
        const attemptCompletedUserWhere = isSuperAdmin ? {} : { organizationId: orgId };

        const totalStudents = await prisma.user.count({ where: studentWhere });
        const totalTeachers = await prisma.user.count({ where: teacherWhere });
        const totalTasks = await prisma.task.count({ where: taskWhere });
        const totalAttempts = await prisma.attempt.count({
            where: { user: attemptUserWhere }
        });

        // Skill-wise performance aggregated from attempts
        const attempts = await prisma.attempt.findMany({
            where: { user: attemptCompletedUserWhere, status: 'COMPLETED' },
            include: { task: true }
        });

        const skillAverages = {
            LISTENING: { sum: 0, count: 0 },
            SPEAKING: { sum: 0, count: 0 },
            READING: { sum: 0, count: 0 },
            WRITING: { sum: 0, count: 0 }
        };

        attempts.forEach(att => {
            if (att.task && att.score !== null) {
                skillAverages[att.task.type].sum += att.score;
                skillAverages[att.task.type].count += 1;
            }
        });

        const skillStats = Object.keys(skillAverages).map(type => ({
            name: type.charAt(0) + type.slice(1).toLowerCase(),
            score: skillAverages[type].count > 0
                ? Math.round(skillAverages[type].sum / skillAverages[type].count)
                : 0
        }));

        // Growth data (simplified: count users signed up by month in current year)
        const currentYear = new Date().getFullYear();
        const users = await prisma.user.findMany({
            where: {
                ...studentWhere,
                createdAt: { gte: new Date(`${currentYear}-01-01`) }
            },
            select: { createdAt: true }
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const growthMap = months.reduce((acc, m) => ({ ...acc, [m]: 0 }), {});

        users.forEach(u => {
            const m = months[u.createdAt.getMonth()];
            growthMap[m] += 1;
        });

        // Cumulative growth
        let cumulative = 0;
        const growthData = months.map(m => {
            cumulative += growthMap[m];
            return { month: m, users: cumulative };
        }).slice(0, new Date().getMonth() + 1);

        res.json({
            totalStudents,
            totalTeachers,
            totalTasks,
            totalAttempts,
            totalOrganizations: isSuperAdmin ? await prisma.organization.count() : 1,
            skillStats,
            growthData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch admin dashboard stats' });
    }
});

// Teacher Dashboard Stats
router.get('/teacher', authMiddleware, authorize(['TEACHER']), async (req, res) => {
    try {
        const teacherId = req.user.id;

        const assignedStudents = await prisma.user.findMany({
            where: { teacherId: teacherId },
            include: {
                progressSummary: true,
                attempts: {
                    take: 5,
                    orderBy: { submittedAt: 'desc' },
                    include: { task: true }
                }
            }
        });

        const tasksAssigned = await prisma.task.count({
            where: { organizationId: req.user.organizationId }
        });

        const pendingReports = assignedStudents.filter(s => {
            const avgScore = s.progressSummary ?
                (s.progressSummary.listeningAvg + s.progressSummary.speakingAvg + s.progressSummary.readingAvg + s.progressSummary.writingAvg) / 4 : 0;
            return avgScore < 50 && s.attempts.length > 0;
        }).length;

        res.json({
            studentCount: assignedStudents.length,
            students: assignedStudents,
            tasksAssigned,
            pendingReports
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch teacher dashboard stats' });
    }
});

// Student Dashboard Stats
router.get('/student', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true,
                progressSummary: true,
                _count: {
                    select: { attempts: true }
                }
            }
        });

        const stats = [
            {
                label: 'Skill Average',
                value: user.progressSummary ? `${Math.round((user.progressSummary.listeningAvg + user.progressSummary.speakingAvg + user.progressSummary.readingAvg + user.progressSummary.writingAvg) / 4)}%` : '0%',
                trend: '+0%'
            },
            {
                label: 'Completed',
                value: user._count.attempts.toLocaleString(),
                trend: 'Recent'
            },
            {
                label: 'Global Rank',
                value: '# --', // Complex calculation, placeholder
                trend: 'Top 100%'
            },
            {
                label: 'Daily Streak',
                value: '0 Days', // Placeholder
                trend: 'New'
            },
        ];

        const assignedTasks = await prisma.attempt.findMany({
            where: {
                userId: userId,
                status: 'ASSIGNED'
            },
            include: {
                task: true
            }
        });

        res.json({
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                plan: user.organization.name
            },
            stats,
            assignedTasks
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch student dashboard stats' });
    }
});

module.exports = router;
