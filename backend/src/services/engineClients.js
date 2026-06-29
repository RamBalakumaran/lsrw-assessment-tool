const https = require('https');
const http = require('http');

function safePost(url, body) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const data = JSON.stringify(body || {});
      const lib = parsed.protocol === 'https:' ? https : http;
      const opts = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + (parsed.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = lib.request(opts, (res) => {
        let resp = '';
        res.on('data', (d) => resp += d);
        res.on('end', () => {
          try { resolve(JSON.parse(resp || '{}')); } catch (e) { resolve({ raw: resp }); }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(data);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function sendToEmbeddingEngine(attemptId, parameterVector, reliability) {
  const url = process.env.EMBEDDING_ENGINE_URL;
  if (!url) return null;
  return safePost(url, { attempt_id: attemptId, parameter_vector: parameterVector, reliability_signal: reliability });
}

async function sendToFusionEngine(attemptId, modality, score, reliability) {
  const url = process.env.FUSION_ENGINE_URL;
  if (!url) return null;
  return safePost(url, { attempt_id: attemptId, modality, score, reliability });
}

async function sendToFeedbackEngine(attemptId, feedbackList) {
  const url = process.env.FEEDBACK_ENGINE_URL;
  if (!url) return null;
  return safePost(url, { attempt_id: attemptId, feedback: feedbackList });
}

async function updateAnalytics(tenantId, userId, attemptData) {
  const url = process.env.ANALYTICS_ENGINE_URL;
  if (!url) return null;
  return safePost(url, { tenant_id: tenantId, user_id: userId, attempt: attemptData });
}

async function sendToRepository(provenance) {
  const url = process.env.REPOSITORY_ENGINE_URL;
  if (!url) return null;
  return safePost(url, provenance);
}

async function sendToInconsistencyEngine(attemptId, projectedVector) {
  const url = process.env.INCONSISTENCY_ENGINE_URL;
  if (!url) return null;
  return safePost(url, { attempt_id: attemptId, projected_vector: projectedVector });
}

async function sendToRemediationEngine(attemptId, deficits) {
  const url = process.env.REMEDIATION_ENGINE_URL;
  if (!url) return null;
  return safePost(url, { attempt_id: attemptId, deficits });
}

module.exports = {
  sendToEmbeddingEngine,
  sendToFusionEngine,
  sendToFeedbackEngine,
  updateAnalytics,
  sendToRepository,
  sendToInconsistencyEngine,
  sendToRemediationEngine
};

module.exports = {
  sendToEmbeddingEngine,
  sendToFusionEngine,
  sendToFeedbackEngine,
  updateAnalytics,
  sendToRepository
};
