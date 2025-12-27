import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const AppearanceSettings = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

<<<<<<< HEAD
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
=======
  const themeOptions = [
    {
      id: 'light',
      name: 'Modo Claro',
      icon: <Sun size={32} className="theme-icon light" />,
      bg: 'var(--surface-color)',
      border: 'var(--border-color)',
      color: 'var(--text-primary)'
    },
    {
      id: 'dark',
      name: 'Modo Oscuro',
      icon: <Moon size={32} className="theme-icon dark" />,
      bg: 'var(--surface-color)',
      border: 'var(--border-color)',
      color: 'var(--text-primary)'
    }
  ];

  return (
    <div className="appearance-settings">
      <h2 className="settings-section-title">Apariencia</h2>
      <p className="settings-section-desc">Personaliza cómo se ve conociendogente en tu dispositivo.</p>
      
      <div className="theme-grid">
        {themeOptions.map((option) => (
          <div 
            key={option.id}
            onClick={() => setTheme(option.id)}
            className={`theme-card ${theme === option.id ? 'active' : ''}`}
          >
            <div className="theme-card-preview" style={{ background: option.id === 'dark' ? '#161e2e' : '#f8fafc' }}>
              <div className="preview-window">
                <div className="preview-header" style={{ background: option.id === 'dark' ? '#1f2937' : '#ffffff' }}></div>
                <div className="preview-content">
                  <div className="preview-line long"></div>
                  <div className="preview-line short"></div>
                </div>
              </div>
              {option.icon}
            </div>
            <h3 className="theme-card-name">{option.name}</h3>
            {theme === option.id && <div className="active-badge">Seleccionado</div>}
          </div>
        ))}
      </div>

      <style>{`
        .appearance-settings {
          animation: fadeIn 0.4s ease-out;
        }
        .settings-section-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .settings-section-desc {
          color: var(--text-secondary);
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }
        .theme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        .theme-card {
          cursor: pointer;
          border-radius: var(--radius-lg);
          border: 2px solid var(--border-color);
          padding: 1rem;
          background: var(--surface-color);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .theme-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent-color);
          box-shadow: var(--shadow-lg);
        }
        .theme-card.active {
          border-color: var(--accent-color);
          background: var(--accent-soft);
        }
        .theme-card-preview {
          height: 120px;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border: 1px solid var(--border-color);
        }
        .preview-window {
          width: 80%;
          height: 70%;
          background: var(--bg-color);
          border-radius: 6px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          opacity: 0.6;
        }
        .preview-header {
          height: 12px;
          width: 100%;
          border-bottom: 1px solid var(--border-color);
        }
        .preview-content {
          padding: 8px;
        }
        .preview-line {
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          margin-bottom: 6px;
        }
        .preview-line.long { width: 100%; }
        .preview-line.short { width: 60%; }
        
        .theme-icon {
          position: absolute;
          bottom: -10px;
          right: -10px;
          opacity: 0.2;
          transform: rotate(-15deg);
          transition: all 0.3s ease;
        }
        .theme-card:hover .theme-icon {
          opacity: 0.8;
          transform: scale(1.1) rotate(0deg);
        }
        .theme-icon.light { color: #f59e0b; }
        .theme-icon.dark { color: #818cf8; }

        .theme-card-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          text-align: center;
        }
        .active-badge {
          font-size: 0.75rem;
          background: var(--accent-color);
          color: white;
          padding: 2px 8px;
          border-radius: 20px;
          position: absolute;
          top: 8px;
          right: 8px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
>>>>>>> d47ff0e (25)
    </div>
  );
};


export default AppearanceSettings;