const express = require('express');
const router = express.Router();
const db = require('../models');

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
                const component = task.lsrwComponent;
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

module.exports = router;
