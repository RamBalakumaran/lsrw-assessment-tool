import React, { useState } from 'react';

const WritingPage = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeText = async () => {
    if (!text.trim()) return alert("Please type something first.");
    
    setLoading(true);
    setResult(null); // Clear previous results while loading

    try {
      const res = await fetch('http://localhost:5000/api/writing/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // If backend sent an error status (500), treat data as an error object
        setResult({ error: data.error || "Unknown Error", details: data.details });
      } else {
        setResult(data);
      }

    } catch (err) {
      console.error(err);
      setResult({ error: "Connection Failed", details: "Is the backend server running?" });
    }
    setLoading(false);
  };

  // Helper style for cards
  const cardStyle = (bgColor) => ({
    flex: 1,
    backgroundColor: bgColor,
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    minWidth: '100px'
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>✍️ Advanced Writing Assistant</h1>
      <p style={{ color: '#666' }}>Type your essay below to check grammar, structure, and tone.</p>
      
      <textarea 
        rows="8" 
        style={{ 
          width: '100%', 
          padding: '15px', 
          fontSize: '16px', 
          borderRadius: '8px',
          border: '1px solid #ccc',
          fontFamily: 'inherit'
        }} 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type here (e.g., 'He go to school yesterday')..."
      />
      
      <button 
        onClick={analyzeText} 
        disabled={loading} 
        style={{ 
          marginTop: '15px', 
          padding: '12px 25px', 
          backgroundColor: '#2ecc71', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "Analyzing..." : "Check My Writing"}
      </button>

      {/* --- RESULTS SECTION --- */}
      {result && (
        <div style={{ marginTop: '30px' }}>
          
          {/* 1. ERROR STATE (Prevents the crash) */}
          {result.error ? (
             <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
               <h3>⚠️ Analysis Failed</h3>
               <p><strong>Reason:</strong> {result.error}</p>
               {result.details && <small style={{ display: 'block', marginTop: '5px' }}>Technical Details: {result.details}</small>}
             </div>
          ) : (
            
            /* 2. SUCCESS STATE */
            <>
              {/* Score Cards */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
                <div style={cardStyle(result.score >= 80 ? '#d4edda' : '#f8d7da')}>
                  <h2 style={{ margin: '0 0 5px 0' }}>{result.score || 0}/100</h2>
                  <p style={{ margin: 0 }}>Overall Score</p>
                </div>
                <div style={cardStyle('#e2e6ea')}>
                  <h2 style={{ margin: '0 0 5px 0' }}>{result.tone || "Neutral"}</h2>
                  <p style={{ margin: 0 }}>Tone</p>
                </div>
                <div style={cardStyle('#fff3cd')}>
                  {/* SAFE ACCESS: Using ?. to prevent crash if stats is undefined */}
                  <h2 style={{ margin: '0 0 5px 0' }}>{result.stats?.avg_len || 0}</h2>
                  <p style={{ margin: 0 }}>Words/Sentence</p>
                </div>
              </div>

              {/* Feedback Box */}
              <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #2196f3' }}>
                <strong>💡 Advice:</strong> {result.structure_feedback || "No structural feedback available."}
              </div>

              {/* Error List */}
              <h3>Found {result.errors?.length || 0} Issues:</h3>
              {(!result.errors || result.errors.length === 0) && (
                <p style={{ color: 'green', fontWeight: 'bold' }}>🎉 No errors found! Excellent work.</p>
              )}
              
              {result.errors?.map((err, idx) => (
                <div key={idx} style={{ 
                  border: '1px solid #ddd', 
                  padding: '15px', 
                  marginBottom: '10px', 
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  borderLeft: `5px solid ${err.type === 'GRAMMAR' ? '#e74c3c' : '#f1c40f'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#555', textTransform: 'uppercase', fontSize: '12px' }}>{err.type || "ISSUE"}</span>
                  </div>
                  
                  <p style={{ fontSize: '18px', margin: '5px 0', fontFamily: 'monospace', backgroundColor: '#f9f9f9', padding: '5px' }}>
                    "...{err.context || "unknown context"}..."
                  </p>
                  
                  <p style={{ color: '#c0392b', margin: '5px 0' }}>❌ {err.message}</p>
                  
                  {err.replacements && err.replacements.length > 0 && (
                    <p style={{ color: '#27ae60', fontWeight: 'bold', margin: '5px 0' }}>
                      ✅ Suggestion: {err.replacements.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WritingPage;