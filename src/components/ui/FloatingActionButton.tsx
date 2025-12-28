import React from 'react';
import './FloatingActionButton.css';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  ariaLabel?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  icon, 
  ariaLabel = 'Acción flotante' 
}) => {
  return (
    <button className="floating-action-btn" onClick={onClick} aria-label={ariaLabel}>
      {icon}
    </button>
  );
};

export default FloatingActionButton;