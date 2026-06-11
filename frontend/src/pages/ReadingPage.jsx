import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ReadingPage = () => {
  // --- CONTENT DATA ---
  const content = {
    title: "The History of the Internet",
    text: "The Internet started in the 1960s as a way for government researchers to share information. Computers in the '60s were large and immobile, and in order to make use of information stored in any one computer, one had to either travel to the site of the computer or have magnetic computer tapes sent through the conventional postal system. January 1, 1983 is considered the official birthday of the Internet. Prior to this, the various computer networks did not have a standard way to communicate with each other. A new communications protocol was established called Transfer Control Protocol/Internetwork Protocol (TCP/IP).",
    questions: [
      {
        id: 1,
        question: "When did the Internet officially start according to the text?",
        options: ["1960s", "Jan 1, 1983", "1990s", "2000s"],
        answer: "Jan 1, 1983"
      },
      {
        id: 2,
        question: "Why was the Internet originally created?",
        options: ["For social media", "For government researchers to share info", "For online shopping", "For streaming movies"],
        answer: "For government researchers to share info"
      },
      {
        id: 3,
        question: "What protocol allowed networks to communicate?",
        options: ["HTTP", "TCP/IP", "FTP", "SSH"],
        answer: "TCP/IP"
      }
    ]
  };

  // --- STATES ---
  const [phase, setPhase] = useState('start'); // start -> reading -> quiz -> result
  
  // Timers
  const [startTime, setStartTime] = useState(0);
  const [readingTimeSec, setReadingTimeSec] = useState(0);
  const [quizTimeSec, setQuizTimeSec] = useState(0);

  // Answers
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);

  // --- HANDLERS ---

  // 1. Start Reading
  const startReading = () => {
    setPhase('reading');
    setStartTime(Date.now());
  };

  // 2. Finish Reading, Start Quiz
  const finishReading = () => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    setReadingTimeSec(duration);
    
    // Reset timer for quiz
    setPhase('quiz');
    setStartTime(Date.now());
  };

  // 3. Handle MCQ Selection
  const handleSelect = (qId, option) => {
    setUserAnswers({ ...userAnswers, [qId]: option });
  };

  // 4. Submit Quiz
  const submitQuiz = () => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    setQuizTimeSec(duration);

    // Calculate Score
    let correctCount = 0;
    content.questions.forEach(q => {
      if (userAnswers[q.id] === q.answer) {
        correctCount++;
      }
    });
    
    // Calculate percentage
    const finalScore = Math.round((correctCount / content.questions.length) * 100);
    setScore(finalScore);
    setPhase('result');
  };

  // Helper: Calculate WPM
  const calculateWPM = () => {
    const wordCount = content.text.split(' ').length;
    const minutes = readingTimeSec / 60;
    return minutes > 0 ? Math.round(wordCount / minutes) : 0;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>📖 Reading & Comprehension</h1>

      {/* PHASE 1: START */}
      {phase === 'start' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h3>Instructions:</h3>
          <p>1. Read the passage as fast as you can.</p>
          <p>2. Answer the questions based on the text.</p>
          <button onClick={startReading} style={btnStyle}>Start Reading</button>
        </div>
      )}

      {/* PHASE 2: READING */}
      {phase === 'reading' && (
        <div>
          <div style={{ backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '10px', lineHeight: '1.8', fontSize: '18px' }}>
            {content.text}
          </div>
          <br/>
          <button onClick={finishReading} style={btnStyle}>I'm Done Reading</button>
        </div>
      )}

      {/* PHASE 3: QUIZ */}
      {phase === 'quiz' && (
        <div>
          <h3>Answer the following Questions:</h3>
          {content.questions.map((q, index) => (
            <div key={q.id} style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <p><strong>{index + 1}. {q.question}</strong></p>
              {q.options.map(opt => (
                <label key={opt} style={{ display: 'block', margin: '5px 0', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name={`q-${q.id}`} 
                    value={opt} 
                    onChange={() => handleSelect(q.id, opt)}
                    checked={userAnswers[q.id] === opt}
                  /> 
                  <span style={{ marginLeft: '10px' }}>{opt}</span>
                </label>
              ))}
            </div>
          ))}
          <button onClick={submitQuiz} style={btnStyle}>Submit Answers</button>
        </div>
      )}

      {/* PHASE 4: RESULTS */}
      {phase === 'result' && (
        <div style={{ textAlign: 'center' }}>
          <h2>📊 Assessment Report</h2>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
            <Card title="Reading Speed" value={`${calculateWPM()} WPM`} color="#3498db" />
            <Card title="Comprehension" value={`${score}%`} color={score > 70 ? "#2ecc71" : "#e74c3c"} />
            <Card title="Answering Time" value={`${Math.round(quizTimeSec)}s`} color="#f1c40f" />
          </div>

          <div style={{ marginTop: '30px', textAlign: 'left', backgroundColor: '#f4f4f4', padding: '20px', borderRadius: '8px' }}>
             <h3>Correct Answers:</h3>
             <ul>
               {content.questions.map(q => (
                 <li key={q.id} style={{ marginBottom: '5px' }}>
                   {q.question} - <strong>{q.answer}</strong>
                 </li>
               ))}
             </ul>
          </div>

          <Link to="/">
            <button style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Try Another Module</button>
          </Link>
        </div>
      )}
    </div>
  );
};

// Simple Styles
const btnStyle = { backgroundColor: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' };
const Card = ({ title, value, color }) => (
  <div style={{ backgroundColor: color, color: 'white', padding: '20px', borderRadius: '10px', width: '150px' }}>
    <h3>{value}</h3>
    <small>{title}</small>
  </div>
);

export default ReadingPage;