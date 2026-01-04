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
  backgroundColor: 'var(--surface-color)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '0', 
  marginBottom: '1rem',
  boxShadow: 'var(--shadow-sm)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};


export default Card;
