const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const prisma = require('../config/prisma');
const { authMiddleware } = require('../middleware/auth');

router.post('/analyze', authMiddleware, async (req, res) => {
    const { text, topic, taskId } = req.body;

    const pythonScript = path.resolve(__dirname, '../../ai-engine/writing_analysis.py');
    const pythonProcess = spawn('python', [pythonScript]);

    let dataString = '';
    let errorString = '';

    const inputData = JSON.stringify({ text, topic });
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => { dataString += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorString += data.toString(); });

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: "Analysis Failed", details: errorString });
        }

        try {
            const result = JSON.parse(dataString);

            // Save attempt if user is authenticated
            if (req.user) {
                await prisma.attempt.create({
                    data: {
                        userId: req.user.id,
                        taskId: taskId || null,
                        score: result.score,
                        aiResults: result,
                        status: 'COMPLETED'
                    }
                });
            }

            res.json(result);
        } catch (e) {
            res.status(500).json({ error: "Invalid Response from AI", details: dataString });
        }
    });
});

module.exports = router;