const express = require('express');
const router = express.Router();
const controller = require('../src/controllers/readingController');
const { authMiddleware } = require('../middleware/auth');

router.get('/passages', authMiddleware, controller.listPassages);
router.get('/passages/:id', authMiddleware, controller.getPassage);
router.post('/passages', authMiddleware, controller.createPassage);
router.put('/passages/:id', authMiddleware, controller.updatePassage);
router.delete('/passages/:id', authMiddleware, controller.deletePassage);

router.post('/attempts/start', authMiddleware, controller.startAttempt);
router.post('/attempts/:attempt_id/submit', authMiddleware, controller.submitAttempt);
router.get('/attempts/:attempt_id/result', authMiddleware, controller.getAttemptResult);
router.get('/attempts/user/:user_id', authMiddleware, controller.getUserAttempts);

router.post('/evaluate', authMiddleware, controller.triggerEvaluation);

router.get('/tenant-config/:tenant_id', authMiddleware, controller.getTenantConfig);
router.put('/tenant-config/:tenant_id', authMiddleware, controller.updateTenantConfig);

module.exports = router;
