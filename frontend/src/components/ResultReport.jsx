import React from 'react';

const ResultReport = ({ data }) => {
  const { overall_score, metrics, transcript, wpm } = data;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <h3>Summary of scores</h3>
      
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
         {['CEFR', 'IELTS', 'PTE', 'TOEFL'].map(t => (
             <span key={t} style={{ fontSize: '12px', color: '#999', padding: '5px', background: '#eee', borderRadius: '4px' }}>{t}</span>
         ))}
      </div>

      {/* Score Card */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        {/* Left: Overall Score Circle */}
        <div style={{ 
            width: '100px', height: '100px', borderRadius: '50%', 
            backgroundColor: '#7cb342', color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 'bold', flexDirection: 'column'
        }}>
            {overall_score}
            <span style={{ fontSize: '12px', fontWeight: 'normal' }}>/ 9</span>
        </div>

        {/* Right: Progress Bars */}
        <div style={{ flex: 1 }}>
            <MetricBar label="Pronunciation" score={metrics.pronunciation} />
            <MetricBar label="Fluency" score={metrics.fluency} />
            <MetricBar label="Vocabulary" score={metrics.vocabulary} />
            <MetricBar label="Grammar" score={metrics.grammar} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button style={actionBtnStyle('#8bc34a')}>Retake test</button>
          <button style={actionBtnStyle('#03a9f4')}>Detailed report</button>
      </div>

      {/* Transcript Section */}
      <div style={{ marginTop: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '15px' }}>
          <h4>Fluency | Pronunciation</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#666' }}>
              <span style={{ background: '#fbc02d', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{wpm} WPM</span>
              <span>⏸ Pauses</span>
          </div>
          
          <p style={{ lineHeight: '1.8', fontSize: '16px', color: '#444' }}>
              <span style={{ color: '#8bc34a', fontSize: '20px', marginRight: '10px' }}>▶</span>
              {transcript || "No speech detected."}
          </p>
          
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
              ⚠️ Highlights indicate areas for improvement (mocked for demo).
          </p>
      </div>
    </div>
  );
};

// Sub-component for Progress Bars
const MetricBar = ({ label, score }) => (
    <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '2px' }}>
            <span>{label}</span>
            <span style={{ color: score > 7 ? '#7cb342' : '#fbc02d' }}>{score}/9</span>
        </div>
        <div style={{ height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
                width: `${(score/9)*100}%`, 
                height: '100%', 
                backgroundColor: score > 7 ? '#7cb342' : '#fbc02d' 
            }}></div>
        </div>
    </div>
);

const actionBtnStyle = (color) => ({
    flex: 1, padding: '12px', border: 'none', borderRadius: '25px',
    backgroundColor: color, color: 'white', fontWeight: 'bold', cursor: 'pointer'
});

export default ResultReport;