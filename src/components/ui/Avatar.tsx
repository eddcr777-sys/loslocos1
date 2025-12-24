import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  style?: React.CSSProperties;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Usuario', size = 'medium', style, className = '' }) => {
  const sizeMap = {
    small: '32px',
    medium: '48px',
    large: '80px'
  };

  const finalStyle: React.CSSProperties = {
    width: sizeMap[size],
    height: sizeMap[size],
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: '#e1e8ed',
    border: '1px solid rgba(0,0,0,0.05)',
    ...style
  };

  return (
    <img 
      src={src || 'https://via.placeholder.com/150?text=Usuario'} 
      alt={alt} 
      style={finalStyle} 
      className={className}
    />
  );
};

export default Avatar;
