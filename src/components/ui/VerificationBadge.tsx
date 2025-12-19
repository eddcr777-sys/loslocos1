import React from 'react';

interface VerificationBadgeProps {
  type?: 'common' | 'popular' | 'admin';
  size?: number;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ type, size = 16 }) => {
  if (!type || type === 'common') return null;

  // Azul para popular, Amarillo/Dorado para admin
  const color = type === 'admin' ? '#f5970bff' : '#1D9BF0'; // Un amarillo/dorado más visible
  const title = type === 'admin' ? 'Administrador' : 'Verificado';

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '4px',
    verticalAlign: 'middle',
  };

  if (type === 'admin') {
    badgeStyle.filter = `drop-shadow(0 0 3px ${color}B3)`; // Sombra/brillo sutil
  }

  return (
    <span title={title} style={badgeStyle}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" 
          fill={color}
        />
      </svg>
    </span>
  );
};

export default VerificationBadge;