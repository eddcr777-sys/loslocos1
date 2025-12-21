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
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '2rem' }}>Preferencias de Notificaciones</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <ToggleItem 
          title="Notificaciones por Correo" 
          desc="Recibe actualizaciones sobre tu cuenta y actividad."
          checked={settings.emailNotifs} 
          onChange={() => toggle('emailNotifs')} 
        />
        <ToggleItem 
          title="Notificaciones Push" 
          desc="Recibe alertas en tiempo real en tu dispositivo."
          checked={settings.pushNotifs} 
          onChange={() => toggle('pushNotifs')} 
        />
        <ToggleItem 
          title="Comunicaciones de Marketing" 
          desc="Recibe noticias sobre nuevas características."
          checked={settings.marketing} 
          onChange={() => toggle('marketing')} 
        />
      </div>
    </div>
  );
};

const ToggleItem = ({ title, desc, checked, onChange }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
    <div>
      <h4 style={{ margin: 0, fontSize: '1rem' }}>{title}</h4>
      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{desc}</p>
    </div>
    <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: checked ? '#2563eb' : '#ccc', transition: '.4s', borderRadius: '34px' }}></span>
      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: checked ? '26px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
    </label>
  </div>
);

export default NotificationSettings;