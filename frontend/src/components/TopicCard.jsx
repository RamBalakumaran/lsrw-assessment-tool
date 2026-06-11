import React from 'react';
import { Link } from 'react-router-dom';

const TopicCard = ({ title, desc, id }) => {
  const cardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };

  const btnStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={cardStyle}>
      <div>
        <h3 style={{ margin: '0 0 5px 0' }}>{title}</h3>
        <p style={{ margin: 0, color: '#666' }}>{desc}</p>
      </div>
      <Link to="/record" state={{ text: desc, title: title }}>
        <button style={btnStyle}>Practice</button>
      </Link>
    </div>
  );
};

export default TopicCard;