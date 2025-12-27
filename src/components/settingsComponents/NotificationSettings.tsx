import React, { useState } from 'react';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifs: true,
    pushNotifs: true,
    marketing: false
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="notification-settings">
      <h2 className="settings-section-title">Notificaciones</h2>
      <p className="settings-section-desc">Gestiona cómo y cuándo quieres recibir noticias de nosotros.</p>
      
      <div className="settings-group">
        <ToggleItem 
          title="Notificaciones por Correo" 
          desc="Recibe actualizaciones sobre tu cuenta, mensajes y actividad de seguidores."
          checked={settings.emailNotifs} 
          onChange={() => toggle('emailNotifs')} 
        />
        <ToggleItem 
          title="Notificaciones Push" 
          desc="Recibe alertas instantáneas en tu navegador o dispositivo móvil."
          checked={settings.pushNotifs} 
          onChange={() => toggle('pushNotifs')} 
        />
        <ToggleItem 
          title="Novedades y Marketing" 
          desc="Mantente al día con nuevas funciones y recomendaciones personalizadas."
          checked={settings.marketing} 
          onChange={() => toggle('marketing')} 
        />
      </div>

      <style>{`
        .notification-settings {
          animation: fadeIn 0.4s ease-out;
        }
        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          padding: 0.5rem;
          border: 1px solid var(--border-color);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const ToggleItem = ({ title, desc, checked, onChange }: any) => (
  <div 
    onClick={onChange}
    style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.25rem',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      transition: 'all 0.2s ease',
      background: 'var(--surface-color)',
    }}
    className="toggle-item-hover"
  >
    <div style={{ flex: 1, paddingRight: '1rem' }}>
      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</h4>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.4' }}>{desc}</p>
    </div>
    <div style={{ position: 'relative', width: '44px', height: '24px', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={() => {}} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ 
        position: 'absolute', 
        top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: checked ? 'var(--accent-color)' : 'var(--text-muted)', 
        opacity: checked ? 1 : 0.3,
        transition: '.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        borderRadius: '34px' 
      }}></span>
      <span style={{ 
        position: 'absolute', 
        height: '18px', width: '18px', 
        left: checked ? '22px' : '3px', 
        bottom: '3px', 
        backgroundColor: 'white', 
        transition: '.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}></span>
    </div>

    <style>{`
      .toggle-item-hover:hover {
        background: var(--surface-hover) !important;
        transform: scale(1.01);
      }
    `}</style>
  </div>
);


export default NotificationSettings;