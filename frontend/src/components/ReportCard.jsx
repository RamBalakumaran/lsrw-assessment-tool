import React from 'react';

const ReportCard = ({ score, type, criteria, onHome }) => {
  
  // Placement-Focused Recommendations
  const getRecommendation = () => {
    if (score >= 85) return "🌟 Highly Recommended for Placement: You demonstrate strong professional communication skills suitable for client-facing roles.";
    if (score >= 65) return "✅ Qualified: You meet the baseline standards. Focus on polishing your grammar and flow to clear HR rounds confidently.";
    return "⚠️ Needs Improvement: Focus on the specific weak areas below before attending technical interviews.";
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={{ color: '#2c3e50', marginBottom: '5px' }}>{type} Assessment Report</h2>
        <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '20px' }}>Placement Readiness Score</p>
        
        {/* Main Score */}
        <div style={styles.headerRow}>
            <div style={styles.scoreCircle}>
                <span style={{ fontSize: '42px', fontWeight: 'bold', color: score >= 70 ? '#27ae60' : '#c0392b' }}>
                    {score}
                </span>
                <span style={{ fontSize: '12px', color: '#888' }}>/ 100</span>
            </div>
            
            {/* Recommendation Box */}
            <div style={styles.recBox}>
                <strong>💡 Recommendation:</strong>
                <p style={{ margin: '5px 0', fontSize: '13px', lineHeight: '1.4' }}>{getRecommendation()}</p>
            </div>
        </div>

        {/* Detailed Criteria Breakdown */}
        <div style={styles.criteriaContainer}>
            <h4 style={{textAlign:'left', margin:'0 0 10px 0', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>Detailed Analysis</h4>
            {Object.entries(criteria || {}).map(([label, val]) => (
                <div key={label} style={styles.criteriaRow}>
                    <span style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>{label}</span>
                    <div style={styles.progressBarBg}>
                        <div style={{...styles.progressBarFill, width: `${val}%`, backgroundColor: val > 75 ? '#2ecc71' : val > 50 ? '#f1c40f' : '#e74c3c'}}></div>
                    </div>
                    <span style={{fontSize:'12px', width:'30px', textAlign:'right'}}>{val}</span>
                </div>
            ))}
        </div>

        <button onClick={onHome} style={styles.btn}>Back to Dashboard</button>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  card: { background: 'white', padding: '25px', borderRadius: '15px', width: '90%', maxWidth: '500px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  headerRow: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  scoreCircle: { minWidth: '100px', height: '100px', borderRadius: '50%', border: '6px solid #f0f0f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  recBox: { flex: 1, background: '#e8f6f3', padding: '15px', borderRadius: '10px', textAlign: 'left', borderLeft: '4px solid #1abc9c' },
  criteriaContainer: { background: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '20px' },
  criteriaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' },
  progressBarBg: { flex: 1, height: '8px', background: '#ddd', borderRadius: '4px', margin: '0 10px' },
  progressBarFill: { height: '100%', borderRadius: '4px' },
  btn: { background: '#34495e', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '25px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }
};

export default ReportCard;