import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  style?: React.CSSProperties;
  to?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'full', 
  className = '',
  style = {},
  to = '/'
}) => {
  const sizeMap = {
    small: { fontSize: '1.25rem', iconSize: 24 },
    medium: { fontSize: '1.5rem', iconSize: 32 },
    large: { fontSize: '2rem', iconSize: 40 },
  };

  const { fontSize, iconSize } = sizeMap[size];
  const primaryColor = '#2563eb'; 

  return (
    <Link 
      to={to} 
      className={`app-logo ${className}`} 
      style={{ 
        textDecoration: 'none', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        color: 'inherit',
        ...style 
      }}
    >
      {(variant === 'full' || variant === 'icon') && (
        <Users size={iconSize} color={primaryColor} />
      )}
      
      {(variant === 'full' || variant === 'text') && (
        <span style={{ 
          fontSize, 
          fontWeight: 700, 
          letterSpacing: '-0.5px',
          background: `linear-gradient(45deg, ${primaryColor}, #9333ea)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: primaryColor // Fallback
        }}>
          ConociendoGente
        </span>
      )}
    </Link>
  );
};

export default Logo;