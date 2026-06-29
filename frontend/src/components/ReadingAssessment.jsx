import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function PassagePane({ passage }) {
  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, maxHeight: 360, overflowY: 'auto' }}>
      <h2>{passage.title}</h2>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{passage.content}</div>
    </div>
  );
}

function QuestionItem({ q, value, onChange }) {
  if (q.questionType === 'MCQ') {
    const options = q.options || [];
    return (
      <div style={{ marginBottom: 12 }}>
        <div><strong>{q.questionText}</strong></div>
        {options.map((opt, i) => (
          <label key={i} style={{ display: 'block', marginTop: 6 }}>
            <input type="radio" name={q.questionId} value={opt} checked={value === opt} onChange={(e) => onChange(q.questionId, e.target.value)} /> {opt}
          </label>
        ))}
      </div>
    );
  }

  if (q.questionType === 'TRUE_FALSE') {
    return (
      <div style={{ marginBottom: 12 }}>
        <div><strong>{q.questionText}</strong></div>
        <label style={{ marginRight: 10 }}><input type="radio" name={q.questionId} value="true" checked={value === 'true'} onChange={(e) => onChange(q.questionId, e.target.value)} /> True</label>
        <label><input type="radio" name={q.questionId} value="false" checked={value === 'false'} onChange={(e) => onChange(q.questionId, e.target.value)} /> False</label>
      </div>
    );
  }

  if (q.questionType === 'FILL_BLANK' || q.questionType === 'SHORT_ANSWER') {
    return (
      <div style={{ marginBottom: 12 }}>
        <div><strong>{q.questionText}</strong></div>
        <input type="text" value={value || ''} onChange={(e) => onChange(q.questionId, e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
      </div>
    );
  }

  return null;
}

export default function ReadingAssessment({ tenantId, passageId }) {
  const [passage, setPassage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [phase, setPhase] = useState('reading');
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/reading/passages/${passageId}?tenant_id=${tenantId}`);
        setPassage(res.data.passage);
        setQuestions(res.data.questions || []);
      } catch (e) {
        console.error('Failed load passage', e);
      }
    }
    if (passageId && tenantId) load();
  }, [passageId, tenantId]);

  const startAttempt = async () => {
    try {
      const r = await api.post('/reading/attempts/start', { tenant_id: tenantId, user_id: localStorage.getItem('userId'), assessment_id: null, passage_id: passageId });
      setAttemptId(r.data.attempt_id);
      setStartTime(Date.now());
      setPhase('reading');
    } catch (e) { console.error('start attempt failed', e); }
  };

  const finishReading = () => {
    setPhase('quiz');
  };

  const handleChange = (qid, val) => setAnswers(prev => ({ ...prev, [qid]: val }));

  const submitAnswers = async () => {
    try {
      const payload = { tenant_id: tenantId, responses: Object.keys(answers).map(qid => ({ question_id: qid, selected_answer: answers[qid], user_id: localStorage.getItem('userId') })) };
      await api.post(`/reading/attempts/${attemptId}/submit`, payload);
      const res = await api.get(`/reading/attempts/${attemptId}/result?tenant_id=${tenantId}`);
      setResult(res.data);
      setPhase('result');
    } catch (e) { console.error('submit failed', e); }
  };

  if (!passage) return <div>Loading passage...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
      <div>
        <PassagePane passage={passage} />

        {phase === 'reading' && (
          <div style={{ marginTop: 12 }}>
            {!attemptId ? <button onClick={startAttempt}>Start Attempt</button> : <button onClick={finishReading}>I'm Done Reading</button>}
          </div>
        )}

        {phase === 'quiz' && (
          <div style={{ marginTop: 12 }}>
            <h3>Questions</h3>
            {questions.map(q => (
              <QuestionItem key={q.questionId} q={q} value={answers[q.questionId]} onChange={handleChange} />
            ))}
            <button onClick={submitAnswers}>Submit</button>
          </div>
        )}
      </div>

      <div>
        <div style={{ background: '#f7f7f7', padding: 16, borderRadius: 8 }}>
          <h4>Attempt Info</h4>
          <div>Tenant: {tenantId}</div>
          <div>Passage: {passage.title}</div>
          <div>Questions: {questions.length}</div>
          <div>Attempt ID: {attemptId || '-'}</div>
        </div>

        {phase === 'result' && result && (
          <div style={{ marginTop: 12, background: '#fff', padding: 12, borderRadius: 8 }}>
            <h4>Results</h4>
            <div><strong>Overall Score:</strong> {(result.parameter_vector?.overall_reading_score*100 || 0).toFixed(1)}%</div>
            <div><strong>Accuracy:</strong> {(result.parameter_vector?.accuracy_rate*100 || 0).toFixed(1)}%</div>
            <div><strong>WPM:</strong> {result.parameter_vector?.words_per_minute?.toFixed(1) || 0}</div>

            <h5 style={{ marginTop: 8 }}>Per-axis</h5>
            <ul>
              <li>Comprehension: {(result.parameter_vector?.comprehension_score*100 || 0).toFixed(1)}%</li>
              <li>Vocabulary: {(result.parameter_vector?.vocabulary_score*100 || 0).toFixed(1)}%</li>
              <li>Grammar: {(result.parameter_vector?.grammar_score*100 || 0).toFixed(1)}%</li>
              <li>Discourse: {(result.parameter_vector?.discourse_coherence_score*100 || 0).toFixed(1)}%</li>
            </ul>

            <h5>Feedback</h5>
            <ul>
              {(result.feedback_generated || []).map((f, i) => (
                <li key={i}><strong>{f.axis}:</strong> {f.message} ({(f.score*100).toFixed(0)}%)</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
