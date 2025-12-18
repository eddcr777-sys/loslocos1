import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', style, onClick }) => {
  return (
    <div 
      className={`ui-card ${className}`} 
      style={{ ...defaultStyles, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const defaultStyles: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #e1e8ed',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};


export default Card;
