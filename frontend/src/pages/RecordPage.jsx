import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Recorder from '../components/Recorder';
import Timer from '../components/Timer';

const RecordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data passed from the TopicCard
  const targetText = location.state?.text || "The quick brown fox jumps over the lazy dog.";
  const title = location.state?.title || "Practice";
  
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleStop = async (audioBlob) => {
    setIsRecording(false);
    setLoading(true);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'record.wav');
    formData.append('targetText', targetText);

    try {
      const res = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      // Navigate to results with data
      navigate('/result', { state: { result: data, target: targetText } });
    } catch (err) {
      console.error(err);
      alert("Error uploading audio. Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2>{title}</h2>
      <p style={{ color: '#777' }}>Read the sentence below aloud:</p>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '10px', 
        fontSize: '22px', 
        margin: '20px 0',
        border: '1px dashed #ccc'
      }}>
        "{targetText}"
      </div>
      
      <Timer active={isRecording} />
      
      {loading ? (
        <p style={{ fontSize: '18px', color: '#007bff' }}>🤖 Analyzing your speech...</p>
      ) : (
        <div onClick={() => !isRecording && setIsRecording(true)}>
            {/* The Recorder component handles the button click logic internally too, 
                but we track state here for the timer */}
            <Recorder onStop={handleStop} />
        </div>
      )}
    </div>
  );
};

export default RecordPage;