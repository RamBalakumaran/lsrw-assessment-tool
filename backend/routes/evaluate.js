const express = require('express');
const router = express.Router();
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const db = require('../src/models');
const { authMiddleware } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// POST /api/evaluate/route
// Accepts routing from Evaluation-Routing Engine (113)
// Body: { attempt_id, tenant_id, user_id, assessment_type_identifier }
router.post('/route', async (req, res) => {
    const { attempt_id, tenant_id, user_id, assessment_type_identifier } = req.body;
    if (!attempt_id || !tenant_id || !assessment_type_identifier) return res.status(400).json({ error: 'attempt_id, tenant_id and assessment_type_identifier required' });
    try {
        if (assessment_type_identifier === 'READING') {
            // route to reading evaluate endpoint
            const reading = require('./reading');
            // call internal route handler
            req.body.attempt_id = attempt_id;
            req.body.tenant_id = tenant_id;
            return require('../src/controllers/readingController').triggerEvaluation(req, res);
        }
        return res.status(400).json({ error: 'Unsupported assessment_type_identifier' });
    } catch (e) {
        console.error('Routing error', e);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/assess-speaking', authMiddleware, upload.single('audio'), async (req, res) => {
    let audioPath = path.resolve(req.file.path);

    if (req.file.originalname) {
        const ext = path.extname(req.file.originalname);
        if (ext) {
            const newPath = audioPath + ext;
            fs.renameSync(audioPath, newPath);
            audioPath = newPath;
        }
    }

    const pythonScript = path.resolve(__dirname, '../../ai-engine/full_assessment.py');
    const topicTitle = req.body.topicTitle || "Speaking Task";
    const topicDesc = req.body.topicDesc || "General speech";
    const pythonProcess = spawn('python', [pythonScript, audioPath, topicTitle, topicDesc]);

    let dataString = '';
    pythonProcess.stdout.on('data', (data) => { dataString += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { console.error("Python Error:", data.toString()); });

    pythonProcess.on('close', async (code) => {
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

        try {
            const result = JSON.parse(dataString);

            // Save attempt if user is authenticated
            if (req.user) {
                await db.Response.create({
                    userId: req.user.id,
                    taskId: req.body.taskId || '00000000-0000-0000-0000-000000000000', // Sequelize expects UUID format or similar. If no taskId, maybe skip?
                    score: Math.round((result.overall_score || 0) * 10),
                    feedback: JSON.stringify(result)
                });
            }

            res.json(result);
        } catch (e) {
            res.status(500).json({ error: "Analysis failed", raw: dataString });
        }
    });
});

module.exports = router;