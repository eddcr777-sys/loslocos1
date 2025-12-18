import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  style, 
  ...props 
}) => {
  
  let baseStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  // Variants
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#1d9bf0', // Twitter/Social Blue
      color: '#fff',
    },
    secondary: {
      backgroundColor: '#eff3f4',
      color: '#0f1419',
    },
    outline: {
        backgroundColor: 'transparent',
        border: '1px solid #cfd9de',
        color: '#1d9bf0'
    },
    ghost: {
        backgroundColor: 'transparent',
        color: '#536471'
    }
  };

  // Sizes
  const sizes: Record<string, React.CSSProperties> = {
    small: {
      padding: '6px 16px',
      fontSize: '0.9rem',
    },
    medium: {
      padding: '10px 20px',
      fontSize: '1rem',
    },
    large: {
      padding: '12px 24px',
      fontSize: '1.1rem',
    },
  };

  const finalStyle = {
    ...baseStyle,
    ...variants[variant],
    ...sizes[size],
    ...style,
  };

  return (
    <button style={finalStyle} {...props}>
      {children}
    </button>
  );
};

export default Button;
