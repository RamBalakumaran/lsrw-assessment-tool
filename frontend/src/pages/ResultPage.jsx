import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DetailedReport from '../components/DetailedReport';

const ResultPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { result, target } = state || {};

  if (!result) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>No Data Found</h2>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', cursor: 'pointer' }}>Go Home</button>
      </div>
    );
  }

  // Transform metrics for DetailedReport
  const metrics = [
    { label: 'Speaking WPM', value: result.wpm || 0 },
    { label: 'Fluency', value: (result.metrics?.fluency || 0) + '/10' },
    { label: 'Vocabulary', value: (result.metrics?.vocabulary || 0) + '/10' },
    { label: 'Grammar', value: (result.metrics?.grammar || 0) + '/10' },
    { label: 'Pronunciation', value: (result.metrics?.pronunciation || 0) + '/10' },
    { label: 'Filler Words', value: result.metrics?.filler_count || 0 }
  ];

  // Generate basic recommendations
  const recommendations = [];
  if (result.overall_score < 60) recommendations.push("Practice speaking more slowly and clearly to improve understanding.");
  if ((result.metrics?.grammar || 0) < 7) recommendations.push("Review grammar rules. Focus on subject-verb agreement and verb tenses.");
  if ((result.metrics?.vocabulary || 0) < 6) recommendations.push("Try to use more varied vocabulary. Read more articles to learn new words.");
  if ((result.metrics?.filler_count || 0) > 3) recommendations.push("You used several filler words. Try pausing silently instead of saying 'um' or 'uh'.");
  if (recommendations.length === 0) recommendations.push("Excellent work! Challenge yourself with more complex topics next time.");

  return (
    <DetailedReport
      title="Speaking"
      score={result.overall_score || 0}
      metrics={metrics}
      mistakes={result.mistakes || []}
      transcript={result.transcription}
      recommendations={recommendations}
      onRetry={() => navigate('/test/1')} // Assuming test ID 1 for now, or could pass from state
      onHome={() => navigate('/')}
    />
  );
};

export default ResultPage;