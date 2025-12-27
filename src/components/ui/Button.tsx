import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
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
    width: fullWidth ? '100%' : 'auto',
  };

  // Variants
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent-color)',
      color: '#ffffff',
      border: '1px solid transparent',
    },
    secondary: {
      backgroundColor: 'var(--surface-hover)',
      color: 'var(--text-primary)',
      border: '1px solid transparent',
    },
    outline: {
        backgroundColor: 'transparent',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)'
    },
    ghost: {
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)'
    },
    danger: {
        backgroundColor: 'var(--error-soft)',
        color: 'var(--error)',
        border: '1px solid var(--error)'
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
