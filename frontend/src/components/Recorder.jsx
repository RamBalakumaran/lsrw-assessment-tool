import React, { useState, useRef } from 'react';

const Recorder = ({ onStop }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        onStop(blob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stop = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const btnStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: recording ? '#dc3545' : '#28a745',
    color: 'white'
  };

  return (
    <div>
      <button onClick={recording ? stop : start} style={btnStyle}>
        {recording ? "⏹ Stop Recording" : "🎤 Start Recording"}
      </button>
    </div>
  );
};

export default Recorder;