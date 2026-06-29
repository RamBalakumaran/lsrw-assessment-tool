const db = require('../models');
const { sendToEmbeddingEngine, sendToFusionEngine, sendToFeedbackEngine, updateAnalytics, sendToRepository, sendToInconsistencyEngine, sendToRemediationEngine } = require('./engineClients');

function levenshtein(a, b) {
  if (!a) return b ? b.length : 0;
  if (!b) return a.length;
  a = a.toLowerCase(); b = b.toLowerCase();
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i-1][j] + 1, matrix[i][j-1] + 1, matrix[i-1][j-1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function tokenize(s) {
  if (!s) return [];
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

async function generateFeedback(parameterVector, thresholds) {
  const feedback = [];
  const { comprehension_score, vocabulary_score, grammar_score, discourse_coherence_score } = parameterVector;

  const defaults = { comprehension: 0.6, vocabulary: 0.6, grammar: 0.6, discourse: 0.6 };
  thresholds = Object.assign(defaults, thresholds || {});

  if (comprehension_score < thresholds.comprehension) {
    feedback.push({ axis: 'COMPREHENSION', level: 'DEFICIENT', score: comprehension_score, message: 'Your reading comprehension needs improvement. Focus on identifying main ideas, supporting details, and drawing conclusions from passages.', remediation_priority: 'HIGH' });
  } else {
    feedback.push({ axis: 'COMPREHENSION', level: 'OK', score: comprehension_score, message: 'Good performance on COMPREHENSION. Keep practicing to maintain this level.' });
  }

  if (vocabulary_score < thresholds.vocabulary) {
    feedback.push({ axis: 'LEXICAL', level: 'DEFICIENT', score: vocabulary_score, message: 'Your vocabulary recognition in reading context is below expected level. Practice identifying word meanings from context clues and expanding your reading vocabulary.', remediation_priority: 'MEDIUM' });
  } else {
    feedback.push({ axis: 'LEXICAL', level: 'OK', score: vocabulary_score, message: 'Good performance on LEXICAL. Keep practicing to maintain this level.' });
  }

  if (grammar_score < thresholds.grammar) {
    feedback.push({ axis: 'GRAMMATICAL', level: 'DEFICIENT', score: grammar_score, message: 'Your grammatical understanding in reading context needs work. Focus on understanding sentence structures, tenses, and grammatical relationships within passages.', remediation_priority: 'MEDIUM' });
  } else {
    feedback.push({ axis: 'GRAMMATICAL', level: 'OK', score: grammar_score, message: 'Good performance on GRAMMATICAL. Keep practicing to maintain this level.' });
  }

  if (discourse_coherence_score < thresholds.discourse) {
    feedback.push({ axis: 'DISCOURSE_COHERENCE', level: 'DEFICIENT', score: discourse_coherence_score, message: 'Your understanding of text organization and passage flow needs improvement. Practice identifying paragraph transitions, logical connections, and text structure.', remediation_priority: 'LOW' });
  } else {
    feedback.push({ axis: 'DISCOURSE_COHERENCE', level: 'OK', score: discourse_coherence_score, message: 'Good performance on DISCOURSE_COHERENCE. Keep practicing to maintain this level.' });
  }

  return feedback;
}

async function evaluateReadingAttempt(attemptId, tenantId) {
  // Load attempt and responses
  const attempt = await db.ReadingAttempt.findOne({ where: { attemptId, tenantId } });
  if (!attempt) throw new Error('Attempt not found');

  const responses = await db.ReadingResponse.findAll({ where: { attemptId, tenantId } });
  const questionIds = responses.map(r => r.questionId);
  const questions = await db.ReadingQuestion.findAll({ where: { questionId: questionIds, tenantId } });
  const questionMap = {};
  questions.forEach(q => questionMap[q.questionId] = q);

  let correctAnswers = 0;
  let totalMarksObtained = 0;
  const axisTotals = { COMPREHENSION: { obtained:0, total:0 }, LEXICAL: { obtained:0, total:0 }, GRAMMATICAL: { obtained:0, total:0 }, DISCOURSE_COHERENCE: { obtained:0, total:0 } };

  for (const resp of responses) {
    const q = questionMap[resp.questionId];
    if (!q) continue;
    const qType = q.questionType;
    const correct = q.correctAnswer || '';
    let isCorrect = false;
    const student = (resp.selectedAnswer || '').toString();

    if (qType === 'MCQ' || qType === 'TRUE_FALSE') {
      isCorrect = student.trim().toLowerCase() === correct.toString().trim().toLowerCase();
    } else if (qType === 'FILL_BLANK') {
      const a = student.trim();
      const b = correct.toString().trim();
      if (a.toLowerCase() === b.toLowerCase()) isCorrect = true;
      else {
        const dist = levenshtein(a,b);
        const thresh = Math.max(1, Math.floor(b.length * 0.25));
        if (dist <= thresh) isCorrect = true;
      }
    } else if (qType === 'SHORT_ANSWER') {
      const refTokens = new Set(tokenize(correct.toString()));
      const respTokens = tokenize(student);
      if (refTokens.size === 0) isCorrect = false;
      else {
        let matches = 0;
        for (const t of respTokens) if (refTokens.has(t)) matches++;
        const overlap = matches / Math.max(refTokens.size, 1);
        isCorrect = overlap >= 0.5; // keyword overlap threshold
      }
    }

    const marks = isCorrect ? parseFloat(q.marks || 1.0) : 0;
    await db.ReadingResponse.update({ isCorrect, marksObtained: marks }, { where: { responseId: resp.responseId } });

    if (isCorrect) correctAnswers++;
    totalMarksObtained += marks;

    const axis = q.competencyAxis || 'COMPREHENSION';
    axisTotals[axis].obtained += marks;
    axisTotals[axis].total += parseFloat(q.marks || 1.0);
  }

  const totalQuestions = responses.length;
  const totalMarks = Object.values(axisTotals).reduce((s, a) => s + a.total, 0) || 1;

  const comprehension_score = axisTotals.COMPREHENSION.total ? axisTotals.COMPREHENSION.obtained / axisTotals.COMPREHENSION.total : 0;
  const vocabulary_score = axisTotals.LEXICAL.total ? axisTotals.LEXICAL.obtained / axisTotals.LEXICAL.total : 0;
  const grammar_score = axisTotals.GRAMMATICAL.total ? axisTotals.GRAMMATICAL.obtained / axisTotals.GRAMMATICAL.total : 0;
  const discourse_coherence_score = axisTotals.DISCOURSE_COHERENCE.total ? axisTotals.DISCOURSE_COHERENCE.obtained / axisTotals.DISCOURSE_COHERENCE.total : 0;

  const weights = { comprehension:0.4, vocabulary:0.25, grammar:0.2, discourse:0.15 };
  const overall = (comprehension_score * weights.comprehension) + (vocabulary_score * weights.vocabulary) + (grammar_score * weights.grammar) + (discourse_coherence_score * weights.discourse);

  const accuracy_rate = totalQuestions ? (correctAnswers / totalQuestions) : 0;

  // compute time and wpm
  const start = attempt.startTime ? new Date(attempt.startTime) : null;
  const end = attempt.endTime ? new Date(attempt.endTime) : new Date();
  const time_spent_seconds = start ? Math.max(0, Math.floor((end - start) / 1000)) : (attempt.timeSpentSeconds || 0);

  // get passage word count
  let word_count = 0;
  if (attempt.passageId) {
    const passage = await db.ReadingPassage.findOne({ where: { passageId: attempt.passageId, tenantId } });
    if (passage) word_count = passage.wordCount || (passage.content ? passage.content.split(/\s+/).length : 0);
  }
  const time_minutes = Math.max(0.001, time_spent_seconds / 60);
  const words_per_minute = time_minutes ? (word_count / time_minutes) : 0;

  const parameter_vector = {
    comprehension_score,
    vocabulary_score,
    grammar_score,
    discourse_coherence_score,
    phonological_score: null,
    overall_reading_score: overall,
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    accuracy_rate,
    time_spent_seconds,
    words_per_minute
  };

  // Determine tenant thresholds
  const tenantCfg = await db.TenantConfig.findByPk(tenantId);
  const thresholds = tenantCfg ? tenantCfg.readingThresholds : undefined;

  const feedback = await generateFeedback(parameter_vector, thresholds);

  // Transactional save and provenance
  const t = await db.sequelize.transaction();
  try {
    await attempt.update({
      timeSpentSeconds: time_spent_seconds,
      wordsPerMinute: words_per_minute,
      totalQuestions,
      correctAnswers,
      accuracyRate: accuracy_rate,
      comprehensionScore: comprehension_score,
      vocabularyScore: vocabulary_score,
      grammarScore: grammar_score,
      discourseCoherenceScore: discourse_coherence_score,
      overallReadingScore: overall,
      parameterVector: parameter_vector,
      reliabilitySignal: 1.0,
      feedbackGenerated: feedback,
      evaluationTimestamp: new Date()
    }, { transaction: t });

    // provenance record
    const provenance = {
      attempt_id: attempt.attemptId,
      tenant_id: tenantId,
      user_id: attempt.userId,
      assessment_id: attempt.assessmentId,
      evaluation_path: attempt.evaluationPath || 'OBJECTIVE',
      modality: attempt.modality || 'READING',
      passage_id: attempt.passageId,
      modality_scores: {
        comprehension_score,
        vocabulary_score,
        grammar_score,
        discourse_coherence_score,
        overall_reading_score: overall
      },
      parameter_vector,
      reliability_signal: 1.0,
      fused_competency_vector: null,
      overall_proficiency_score: null,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      accuracy_rate,
      time_spent_seconds,
      words_per_minute,
      evaluation_timestamp: new Date().toISOString(),
      created_at: new Date(),
      updated_at: new Date()
    };

    // send to embedding engine (114)
    await sendToEmbeddingEngine(attempt.attemptId, parameter_vector, 1.0).catch(e => console.error('Embedding engine error', e));
    // send to fusion engine (115)
    await sendToFusionEngine(attempt.attemptId, 'READING', overall, 1.0).catch(e => console.error('Fusion engine error', e));
    // send feedback to feedback engine (109)
    await sendToFeedbackEngine(attempt.attemptId, feedback).catch(e => console.error('Feedback engine error', e));
    // update analytics (110)
    await updateAnalytics(tenantId, attempt.userId, provenance).catch(e => console.error('Analytics error', e));
    // send provenance to repository (112)
    await sendToRepository(provenance).catch(e => console.error('Repository error', e));

    // Send projected vector to inconsistency detection (116) and remediation (117) hooks if available
    try {
      // send to inconsistency detection (116)
      if (typeof sendToInconsistencyEngine === 'function') {
        sendToInconsistencyEngine(attempt.attemptId, parameter_vector).catch(e => console.error('Inconsistency engine error', e));
      }
      // compute high-confidence deficits for remediation engine (117)
      const deficits = [];
      if (comprehension_score < (thresholds?.comprehension ?? 0.6)) deficits.push({ axis: 'COMPREHENSION', score: comprehension_score, confidence: 1.0 });
      if (vocabulary_score < (thresholds?.vocabulary ?? 0.6)) deficits.push({ axis: 'LEXICAL', score: vocabulary_score, confidence: 1.0 });
      if (grammar_score < (thresholds?.grammar ?? 0.6)) deficits.push({ axis: 'GRAMMATICAL', score: grammar_score, confidence: 1.0 });
      if (discourse_coherence_score < (thresholds?.discourse ?? 0.6)) deficits.push({ axis: 'DISCOURSE_COHERENCE', score: discourse_coherence_score, confidence: 1.0 });
      if (deficits.length && typeof sendToRemediationEngine === 'function') {
        sendToRemediationEngine(attempt.attemptId, deficits).catch(e => console.error('Remediation engine error', e));
      }
    } catch (e) {
      console.error('Post-eval engine hooks error', e);
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return { parameter_vector, reliability_signal: 1.0, feedback, scores: { overall: overall } };
}

module.exports = { evaluateReadingAttempt };
