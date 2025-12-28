import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Lock, Mail, Trash2, Shield, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SettingsCard from './ui/SettingsCard';
import SettingsInput from './ui/SettingsInput';
import SettingsToggle from './ui/SettingsToggle';
import Button from '../ui/Button';

const AccountSettings = () => {
  const { user, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(true);
  
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showEmail: false,
    showFaculty: true,
  });
  
  // Load settings on mount
  React.useEffect(() => {
    if (user?.id) {
        import('../../services/api').then(({ api }) => {
            api.getSettings(user.id).then(({ data }) => {
                if (data) {
                    setPrivacy({
                        publicProfile: data.public_profile ?? true,
                        showEmail: data.show_email ?? false,
                        showFaculty: data.show_faculty ?? true
                    });
                }
                setPrivacyLoading(false);
            });
        });
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      alert('Error al actualizar contraseña: ' + error.message);
    } else {
      alert('Contraseña actualizada correctamente');
      setPassword('');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción eliminará permanentemente tu perfil, publicaciones, comentarios y configuraciones.\n\nEsta acción NO se puede deshacer."
    );

    if (confirmed) {
      try {
        const { api } = await import('../../services/api');
        const { error } = await api.deleteUserAccount();
        if (error) throw error;
        await logout();
        window.location.href = '/';
      } catch (error: any) {
        alert('Error al eliminar la cuenta: ' + error.message);
      }
    }
  };

  const togglePrivacy = async (key: keyof typeof privacy) => {
    const newValue = !privacy[key];
    setPrivacy(prev => ({ ...prev, [key]: newValue }));

    const dbKeyMap: Record<string, string> = {
        publicProfile: 'public_profile',
        showEmail: 'show_email',
        showFaculty: 'show_faculty'
    };

    if (user?.id) {
        const { api } = await import('../../services/api');
        await api.updateSettings(user.id, { [dbKeyMap[key]]: newValue });
    }
  };

  return (
    <div className="settings-section animate-fade-in">
      <div className="settings-section-header">
        <h2>Cuenta y Seguridad</h2>
        <p>Administra tu información de acceso, privacidad y seguridad de la cuenta.</p>
      </div>

      <SettingsCard 
        title="Correo Electrónico" 
        description="El correo asociado a tu cuenta UniFeed."
        icon={<Mail size={24} />}
      >
        <div style={{ 
          padding: '1.25rem', 
          background: 'var(--bg-color)', 
          borderRadius: '16px', 
          border: '1px solid var(--border-color)', 
          color: 'var(--text-primary)',
          fontSize: '1rem'
        }}>
          Tu correo actual es: <strong style={{ color: 'var(--accent-color)' }}>{user?.email}</strong>
        </div>
      </SettingsCard>

      <SettingsCard 
        title="Cambiar Contraseña" 
        description="Te recomendamos usar una contraseña única que no uses en otros servicios."
        icon={<Lock size={24} />}
      >
        <form onSubmit={handlePasswordChange}>
          <SettingsInput 
            label="Nueva Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Introduce al menos 6 caracteres"
          />
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" disabled={loading || !password}>
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </div>
        </form>
      </SettingsCard>


      <SettingsCard 
        title="Seguridad Adicional" 
        description="Opciones avanzadas para proteger tu identidad."
        icon={<Shield size={24} />}
      >
        <div className="settings-toggle-row" style={{ cursor: 'default' }}>
          <div className="settings-toggle-info">
            <h4>Verificación en dos pasos</h4>
            <p>Añade una capa extra de seguridad solicitando un código al iniciar sesión.</p>
          </div>
          <Button variant="outline" size="small">Configurar</Button>
        </div>
      </SettingsCard>

      <SettingsCard 
        title="Zona de Peligro" 
        description="Estas acciones son permanentes y no pueden revertirse."
        icon={<Trash2 size={24} />}
        variant="danger"
      >
        <div style={{ 
            padding: '1.5rem', 
            background: 'var(--error-soft)', 
            borderRadius: '16px', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: '1.5rem'
        }}>
            <p style={{ color: 'var(--error)', margin: 0, fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5 }}>
                Al eliminar tu cuenta, se perderán todos tus posts, seguidores, notificaciones y fotos. 
                Esta acción no se puede deshacer.
            </p>
        </div>
        <Button 
          variant="danger"
          onClick={handleDeleteAccount}
          fullWidth
          size="large"
        >
          Eliminar Mi Cuenta UniFeed
        </Button>
      </SettingsCard>
    </div>
  );
};

export default AccountSettings;