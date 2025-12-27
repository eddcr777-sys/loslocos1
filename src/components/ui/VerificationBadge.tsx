import React from 'react';

interface VerificationBadgeProps {
  type?: 'common' | 'popular' | 'admin' | 'ceo' | 'institutional';
  size?: number;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ type, size = 16 }) => {
  if (!type || type === 'common') return null;

  // Colores: 
  // popular: Azul Twitter
  // admin/ceo: Dorado/Ambar (Poder)
  // institutional: Esmeralda (Confianza/Oficialismo)
  let color = 'var(--faculty-eng)';
  let title = 'Verificado';

  if (type === 'admin' || type === 'ceo') {
    color = 'var(--warning)'; // Amber / Gold
    title = 'Administrador';
  } else if (type === 'institutional') {
    color = 'var(--success)'; // Emerald / Green
    title = 'Personal Universitario';
  }

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '4px',
    verticalAlign: 'middle',
  };

  if (type === 'admin' || type === 'ceo' || type === 'institutional') {
    badgeStyle.filter = `drop-shadow(0 0 4px var(--accent-soft))`;
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