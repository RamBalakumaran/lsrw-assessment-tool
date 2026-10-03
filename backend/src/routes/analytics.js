const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

router.get('/teacher', async (req, res) => {
    try {
        // Ideally, we extract teacher ID from req.headers.authorization via jwt middleware.
        // For simplicity, we just fetch global analytics.
        const allResponses = await db.Response.findAll();
        
        let totalScore = 0;
        let peak = 0;
        let totalAttempts = allResponses.length;
        
        let listeningScores = [];
        let speakingScores = [];
        let readingScores = [];
        let writingScores = [];

        for (const resp of allResponses) {
            totalScore += resp.score || 0;
            if ((resp.score || 0) > peak) peak = resp.score;

            // Fetch the task to know its type
            const task = await db.Task.findByPk(resp.taskId);
            if (task) {
                const component = (task.lsrwComponent || '').toUpperCase();
                if (component === 'LISTENING') listeningScores.push(resp.score || 0);
                if (component === 'SPEAKING') speakingScores.push(resp.score || 0);
                if (component === 'READING') readingScores.push(resp.score || 0);
                if (component === 'WRITING') writingScores.push(resp.score || 0);
            }
        }

        const avg = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
        const avgList = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

        res.json({
            avg,
            peak,
            totalAttempts,
            skillProficiency: [
                { skill: "Speaking", val: avgList(speakingScores), color: "rose" },
                { skill: "Listening", val: avgList(listeningScores), color: "emerald" },
                { skill: "Reading", val: avgList(readingScores), color: "amber" },
                { skill: "Writing", val: avgList(writingScores), color: "indigo" }
            ]
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: "Failed to load analytics" });
    }
});

router.get('/compare', async (req, res) => {
    try {
        const { mode, ids, taskIds, contextId, role, dateFrom, dateTo } = req.query;
        // ids might be empty for 'overall' mode
        const idList = ids ? ids.split(',').filter(Boolean) : [];
        if (mode !== 'overall' && idList.length === 0) return res.json([]);
        
        const filterTaskIds = taskIds ? taskIds.split(',').filter(Boolean) : [];

        let results = [];
        
        const dateFilter = {};
        if (dateFrom || dateTo) {
            dateFilter.submittedAt = {};
            if (dateFrom) dateFilter.submittedAt[Op.gte] = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter.submittedAt[Op.lte] = end;
            }
        }

        if (mode === 'overall') {
            let whereClause = {};
            if (role === 'STUDENT') {
                if (!contextId || contextId === 'undefined') return res.json([]);
                whereClause = { userId: contextId, ...dateFilter };
            } else if (contextId && contextId !== 'undefined') {
                whereClause = { userId: contextId, ...dateFilter };
            } else {
                whereClause = { ...dateFilter };
            }
            // Add teacher-specific logic here if needed (e.g. students in their groups)

            const responses = await db.Response.findAll({ where: whereClause });
            const tasks = await db.Task.findAll();
            const taskMap = {};
            tasks.forEach(t => taskMap[t.id] = t.lsrwComponent || t.type || 'SPEAKING');

            const stats = {
                'LISTENING': { total: 0, count: 0, name: 'Listening' },
                'SPEAKING': { total: 0, count: 0, name: 'Speaking' },
                'READING': { total: 0, count: 0, name: 'Reading' },
                'WRITING': { total: 0, count: 0, name: 'Writing' }
            };

            responses.forEach(r => {
                const type = taskMap[r.taskId];
                if (type && stats[type]) {
                    stats[type].total += (r.score || 0);
                    stats[type].count += 1;
                }
            });

            results = Object.values(stats).map(s => ({
                name: s.name,
                score: s.count > 0 ? Math.round(s.total / s.count) : 0
            }));
        }
        else if (mode === 'student-tasks') {
            if (!contextId || contextId === 'undefined') return res.json([]);
            
            const responses = await db.Response.findAll({
                where: {
                    userId: contextId,
                    taskId: idList,
                    ...dateFilter
                }
            });

            const tasks = await db.Task.findAll({ where: { id: idList } });
            const grouped = {};
            tasks.forEach(t => grouped[t.id] = { total: 0, count: 0, name: t.title });

            responses.forEach(r => {
                if (grouped[r.taskId]) {
                    grouped[r.taskId].total += (r.score || 0);
                    grouped[r.taskId].count += 1;
                }
            });

            results = Object.keys(grouped).map(id => ({
                id,
                name: grouped[id].name,
                score: grouped[id].count > 0 ? Math.round(grouped[id].total / grouped[id].count) : 0
            }));
        } 
        else if (mode === 'teacher-students' || mode === 'admin-teachers') {
            const queryWhere = { 
                userId: idList,
                ...dateFilter
            };
            if (filterTaskIds.length > 0) {
                queryWhere.taskId = filterTaskIds;
            }
            
            const responses = await db.Response.findAll({ where: queryWhere });
            const users = await db.User.findAll({ where: { id: idList } });
            const tasks = await db.Task.findAll();
            const taskMap = {};
            tasks.forEach(t => taskMap[t.id] = t.lsrwComponent || t.type || 'SPEAKING');

            const grouped = {};
            users.forEach(u => {
                grouped[u.id] = { 
                    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                    LISTENING: { total: 0, count: 0 },
                    SPEAKING: { total: 0, count: 0 },
                    READING: { total: 0, count: 0 },
                    WRITING: { total: 0, count: 0 },
                }
            });

            responses.forEach(r => {
                if (grouped[r.userId]) {
                    const type = taskMap[r.taskId] ? taskMap[r.taskId].toUpperCase() : 'SPEAKING';
                    if (grouped[r.userId][type]) {
                        grouped[r.userId][type].total += (r.score || 0);
                        grouped[r.userId][type].count += 1;
                    }
                }
            });

            results = Object.keys(grouped).map(id => {
                const u = grouped[id];
                return {
                    id,
                    name: u.name,
                    Listening: u.LISTENING.count > 0 ? Math.round(u.LISTENING.total / u.LISTENING.count) : 0,
                    Speaking: u.SPEAKING.count > 0 ? Math.round(u.SPEAKING.total / u.SPEAKING.count) : 0,
                    Reading: u.READING.count > 0 ? Math.round(u.READING.total / u.READING.count) : 0,
                    Writing: u.WRITING.count > 0 ? Math.round(u.WRITING.total / u.WRITING.count) : 0
                };
            });
        }

        res.json(results);
    } catch (error) {
        console.error("Comparison Analytics Error:", error);
        res.status(500).json({ error: "Failed to load comparison data" });
    }
});

module.exports = router;
