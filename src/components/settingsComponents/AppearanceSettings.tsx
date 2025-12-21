import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const AppearanceSettings = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '2rem' }}>Apariencia</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <div 
          onClick={() => setTheme('light')}
          style={{ cursor: 'pointer', border: `2px solid ${theme === 'light' ? '#2563eb' : '#e2e8f0'}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: 'white' }}
        >
          <Sun size={32} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1rem' }}>Modo Claro</h3>
        </div>

        <div 
          onClick={() => setTheme('dark')}
          style={{ cursor: 'pointer', border: `2px solid ${theme === 'dark' ? '#2563eb' : '#e2e8f0'}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: '#1e293b', color: 'white' }}
        >
          <Moon size={32} style={{ color: '#60a5fa', marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1rem' }}>Modo Oscuro</h3>
        </div>
      </div>
      
      <p style={{ marginTop: '2rem', color: '#64748b', fontSize: '0.9rem' }}>Nota: El modo oscuro se aplicará a toda la aplicación (requiere configuración CSS global adicional para ser perfecto).</p>
    </div>
  );
};

export default AppearanceSettings;