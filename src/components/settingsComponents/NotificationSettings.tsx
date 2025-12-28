import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, Zap, Mail } from 'lucide-react';
import SettingsCard from './ui/SettingsCard';
import SettingsToggle from './ui/SettingsToggle';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const NotificationSettings = () => {
  const { user } = useAuth(); // Assuming useAuth exposes user.id
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifs: true,
    pushNotifs: true,
    mentions: true,
    likes: true,
    marketing: false
  });

  useEffect(() => {
    if (user?.id) {
        loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await api.getSettings(user!.id);
    if (data) {
        setSettings({
            emailNotifs: data.email_notifs ?? true,
            pushNotifs: data.push_notifs ?? true,
            mentions: data.notify_mentions ?? true,
            likes: data.notify_likes ?? true,
            marketing: data.notify_marketing ?? false
        });
    }
    setLoading(false);
  };

  const toggle = async (key: keyof typeof settings) => {
    // Optimistic update
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));

    // Map state keys to DB column names
    const dbKeyMap: Record<string, string> = {
        emailNotifs: 'email_notifs',
        pushNotifs: 'push_notifs',
        mentions: 'notify_mentions',
        likes: 'notify_likes',
        marketing: 'notify_marketing'
    };

    if (user?.id) {
        await api.updateSettings(user.id, { [dbKeyMap[key]]: newValue });
    }
  };

  if (loading) return <div className="settings-section" style={{ padding: '2rem', textAlign: 'center' }}>Cargando preferencias...</div>;

  return (
    <div className="settings-section animate-fade-in">
      <div className="settings-section-header">
        <h2>Notificaciones</h2>
        <p>Controla cómo quieres que te avisemos sobre lo que pasa en tu red.</p>
      </div>
      
      <SettingsCard 
        title="Canales Preferidos" 
        description="Elige dónde quieres que aparezcan nuestras alertas."
        icon={<Smartphone size={24} />}
      >
        <SettingsToggle 
          title="Notificaciones Push" 
          description="Alertas inmediatas en tu navegador o dispositivo móvil."
          checked={settings.pushNotifs} 
          onChange={() => toggle('pushNotifs')} 
        />
        <SettingsToggle 
          title="Resúmenes por Correo" 
          description="Recibe lo más importante de la semana en tu bandeja de entrada."
          checked={settings.emailNotifs} 
          onChange={() => toggle('emailNotifs')} 
        />
      </SettingsCard>

      <SettingsCard 
        title="Interacciones y Social" 
        description="Personaliza qué tipo de actividad social genera una notificación."
        icon={<Zap size={24} />}
      >
        <SettingsToggle 
          title="Menciones" 
          description="Te avisaremos cuando alguien te etiquete en un post."
          checked={settings.mentions} 
          onChange={() => toggle('mentions')} 
        />
        <SettingsToggle 
          title="Likes y Reacciones" 
          description="Mantente al tanto de quién reacciona a tus publicaciones."
          checked={settings.likes} 
          onChange={() => toggle('likes')} 
        />
      </SettingsCard>

      <SettingsCard 
        title="UniFeed Oficial" 
        description="Novedades sobre la plataforma y nuevas funcionalidades."
        icon={<Bell size={24} />}
      >
        <SettingsToggle 
          title="Anuncios y Novedades" 
          description="Aprende sobre nuevas herramientas antes que nadie."
          checked={settings.marketing} 
          onChange={() => toggle('marketing')} 
        />
      </SettingsCard>
    </div>
  );
};

export default NotificationSettings;