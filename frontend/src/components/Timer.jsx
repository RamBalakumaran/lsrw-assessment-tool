import React, { useState, useEffect } from 'react';

const Timer = ({ active }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (active) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div style={{ fontSize: '18px', margin: '15px 0', color: '#666' }}>
      ⏱ Time: {seconds}s
    </div>
  );
};

export default Timer;