import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ListeningPage = () => {
  // --- MOCK DATA ---
  // You can replace the audio URL with any public MP3 link or a local file in 'public' folder
  const audioUrl = "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav"; 
  
  const quizData = [
    {
      id: 1,
      question: "What is the primary instrument heard in the intro?",
      options: ["Flute", "Clarinet", "Saxophone", "Piano"],
      correct: "Flute" // (Hypothetical answer for the demo file)
    },
    {
      id: 2,
      question: "What is the tempo of the music?",
      options: ["Very Slow", "Upbeat / Playful", "Aggressive", "Melancholic"],
      correct: "Upbeat / Playful"
    },
    {
      id: 3,
      question: "Did the music involve drums?",
      options: ["Yes", "No"],
      correct: "Yes"
    }
  ];

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleOptionChange = (qId, val) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const calculateScore = () => {
    let correctCount = 0;
    quizData.forEach((q) => {
      if (answers[q.id] === q.correct) {
        correctCount++;
      }
    });
    
    const percentage = Math.round((correctCount / quizData.length) * 100);
    setScore(percentage);
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎧 Listening & Comprehension</h1>
      
      {/* AUDIO PLAYER */}
      <div style={{ backgroundColor: '#eef', padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '30px' }}>
        <p>Listen to the audio clip below, then answer the questions.</p>
        <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '500px' }} />
      </div>

      {/* QUIZ SECTION */}
      {!submitted ? (
        <div>
          {quizData.map((q, index) => (
            <div key={q.id} style={{ marginBottom: '25px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <p style={{ fontWeight: 'bold' }}>{index + 1}. {q.question}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {q.options.map((opt) => (
                  <label key={opt} style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name={`question-${q.id}`} 
                      value={opt}
                      onChange={() => handleOptionChange(q.id, opt)}
                      checked={answers[q.id] === opt}
                    />
                    <span style={{ marginLeft: '10px' }}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button 
            onClick={calculateScore} 
            disabled={Object.keys(answers).length < quizData.length}
            style={{
              padding: '12px 24px', 
              fontSize: '16px', 
              backgroundColor: Object.keys(answers).length < quizData.length ? '#ccc' : '#28a745',
              color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
            }}
          >
            Submit Answers
          </button>
        </div>
      ) : (
        /* RESULTS SECTION */
        <div style={{ textAlign: 'center', padding: '40px', border: '1px solid #ccc', borderRadius: '10px' }}>
          <h2>Your Score</h2>
          <div style={{ fontSize: '60px', fontWeight: 'bold', color: score >= 70 ? 'green' : 'red' }}>
            {score}%
          </div>
          <p>{score >= 70 ? "Great Listening Skills!" : "Keep Practicing!"}</p>
          
          <Link to="/">
            <button style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Back to Home</button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ListeningPage;