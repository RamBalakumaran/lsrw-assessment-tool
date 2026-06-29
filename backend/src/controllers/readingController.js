const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { evaluateReadingAttempt } = require('../services/readingService');

// GET /api/reading/passages?tenant_id={tid}
exports.listPassages = async (req, res) => {
  const tenantId = req.query.tenant_id || req.body.tenant_id;
  if (!tenantId) return res.status(400).json({ error: 'tenant_id required' });
  try {
    const passages = await db.ReadingPassage.findAll({ where: { tenantId, isActive: true } });
    res.json(passages);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// GET /api/reading/passages/:id?tenant_id={tid}
exports.getPassage = async (req, res) => {
  const tenantId = req.query.tenant_id;
  const passageId = req.params.id;
  if (!tenantId) return res.status(400).json({ error: 'tenant_id required' });
  try {
    const passage = await db.ReadingPassage.findOne({ where: { passageId, tenantId } });
    if (!passage) return res.status(404).json({ error: 'Not found' });
    const questions = await db.ReadingQuestion.findAll({ where: { passageId, tenantId, isActive: true }, order: [['questionOrder','ASC']] });
    res.json({ passage, questions });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// POST /api/reading/passages
exports.createPassage = async (req, res) => {
  const { tenant_id, title, content, difficulty_level, topic, questions } = req.body;
  if (!tenant_id || !content) return res.status(400).json({ error: 'tenant_id and content required' });
  try {
    const passage = await db.ReadingPassage.create({ tenantId: tenant_id, title, content, difficultyLevel: difficulty_level, topic, wordCount: content ? content.split(/\s+/).length : 0, createdBy: req.user ? req.user.id : null });
    if (Array.isArray(questions)) {
      for (const q of questions) {
        await db.ReadingQuestion.create({ passageId: passage.passageId, tenantId: tenant_id, questionText: q.question_text, questionType: q.question_type, options: q.options || null, correctAnswer: q.correct_answer, marks: q.marks || 1.0, competencyAxis: q.competency_axis, questionOrder: q.question_order || 0 });
      }
    }
    res.status(201).json({ passageId: passage.passageId });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// PUT /api/reading/passages/:id
exports.updatePassage = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.body.tenant_id || req.query.tenant_id;
  if (!tenantId) return res.status(400).json({ error: 'tenant_id required' });
  try {
    const passage = await db.ReadingPassage.findOne({ where: { passageId: id, tenantId } });
    if (!passage) return res.status(404).json({ error: 'Not found' });
    await passage.update({ title: req.body.title || passage.title, content: req.body.content || passage.content, difficultyLevel: req.body.difficulty_level || passage.difficultyLevel, topic: req.body.topic || passage.topic, wordCount: req.body.content ? req.body.content.split(/\s+/).length : passage.wordCount });
    res.json({ message: 'Updated' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// DELETE /api/reading/passages/:id?tenant_id={tid}
exports.deletePassage = async (req, res) => {
  const tenantId = req.query.tenant_id;
  const id = req.params.id;
  if (!tenantId) return res.status(400).json({ error: 'tenant_id required' });
  try {
    const passage = await db.ReadingPassage.findOne({ where: { passageId: id, tenantId } });
    if (!passage) return res.status(404).json({ error: 'Not found' });
    await passage.update({ isActive: false });
    res.json({ message: 'Deleted' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// POST /api/reading/attempts/start
exports.startAttempt = async (req, res) => {
  const { tenant_id, user_id, assessment_id, passage_id } = req.body;
  if (!tenant_id || !user_id || !passage_id) return res.status(400).json({ error: 'tenant_id, user_id, passage_id required' });
  try {
    const attempt = await db.ReadingAttempt.create({ tenantId: tenant_id, userId: user_id, assessmentId: assessment_id, passageId: passage_id, startTime: new Date() });
    res.status(201).json({ attempt_id: attempt.attemptId });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// POST /api/reading/attempts/:attempt_id/submit
exports.submitAttempt = async (req, res) => {
  const attemptId = req.params.attempt_id;
  const body = req.body;
  const tenantId = body.tenant_id || req.query.tenant_id;
  if (!tenantId) return res.status(400).json({ error: 'tenant_id required' });
  if (!Array.isArray(body.responses)) return res.status(400).json({ error: 'responses array required' });
  try {
    // save responses
    for (const r of body.responses) {
      await db.ReadingResponse.create({ attemptId, questionId: r.question_id, userId: r.user_id || null, tenantId, selectedAnswer: r.selected_answer, responseTimestamp: new Date() });
    }
    // set end time on attempt
    const attempt = await db.ReadingAttempt.findOne({ where: { attemptId, tenantId } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    await attempt.update({ endTime: new Date() });

    // perform full evaluation
    const result = await evaluateReadingAttempt(attemptId, tenantId);
    res.json(result);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// GET /api/reading/attempts/:attempt_id/result
exports.getAttemptResult = async (req, res) => {
  const attemptId = req.params.attempt_id;
  const tenantId = req.query.tenant_id;
  if (!tenantId) return res.status(400).json({ error: 'tenant_id required' });
  try {
    const attempt = await db.ReadingAttempt.findOne({ where: { attemptId, tenantId } });
    if (!attempt) return res.status(404).json({ error: 'Not found' });
    res.json(attempt);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// GET /api/reading/attempts/user/:user_id?tenant_id={tid}
exports.getUserAttempts = async (req, res) => {
  const userId = req.params.user_id;
  const tenantId = req.query.tenant_id;
  if (!tenantId) return res.status(400).json({ error: 'tenant_id required' });
  try {
    const attempts = await db.ReadingAttempt.findAll({ where: { userId, tenantId }, order: [['createdAt','DESC']] });
    res.json(attempts);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// GET/PUT tenant thresholds
exports.getTenantConfig = async (req, res) => {
  const tenantId = req.params.tenant_id || req.query.tenant_id;
  if (!tenantId) return res.status(400).json({ error: 'tenant_id required' });
  try {
    const cfg = await db.TenantConfig.findByPk(tenantId);
    if (!cfg) return res.status(404).json({ error: 'Not found' });
    res.json(cfg);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

exports.updateTenantConfig = async (req, res) => {
  const tenantId = req.params.tenant_id || req.body.tenant_id;
  const readingThresholds = req.body.reading_thresholds;
  if (!tenantId || !readingThresholds) return res.status(400).json({ error: 'tenant_id and reading_thresholds required' });
  try {
    const [cfg, created] = await db.TenantConfig.findOrCreate({ where: { tenantId }, defaults: { tenantId, readingThresholds } });
    if (!created) await cfg.update({ readingThresholds });
    res.json({ tenantId, readingThresholds });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// POST /api/reading/evaluate
exports.triggerEvaluation = async (req, res) => {
  const { attempt_id, tenant_id } = req.body;
  if (!attempt_id || !tenant_id) return res.status(400).json({ error: 'attempt_id and tenant_id required' });
  try {
    const result = await evaluateReadingAttempt(attempt_id, tenant_id);
    res.json(result);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'Server error' }); }
};
