const express = require('express');
const router = express.Router();
const controller = require('../src/controllers/readingController');

// This endpoint is intended to be called by the Evaluation-Routing Engine (113).
// It accepts attempt_id and tenant_id and triggers evaluation. No user auth assumed.
router.post('/evaluate', async (req, res) => {
  const { attempt_id, tenant_id } = req.body;
  if (!attempt_id || !tenant_id) return res.status(400).json({ error: 'attempt_id and tenant_id required' });
  try {
    const result = await controller.triggerEvaluation(req, res);
    // controller.triggerEvaluation already sends response; avoid double-send
  } catch (e) {
    console.error('Assessment route error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
