import React from 'react';
import TopicCard from '../components/TopicCard';

const SpeakingTests = () => {
  const topics = [
    { id: 1, title: "Introduction", desc: "My name is John and I love programming." },
    { id: 2, title: "The Quick Fox", desc: "The quick brown fox jumps over the lazy dog." },
    { id: 3, title: "Weather", desc: "The weather today is sunny and bright." },
  ];

  return (
    <div>
      <h1 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>🗣 Speaking Topics</h1>
      {topics.map(t => (
        <TopicCard key={t.id} {...t} />
      ))}
    </div>
  );
};

export default SpeakingTests;