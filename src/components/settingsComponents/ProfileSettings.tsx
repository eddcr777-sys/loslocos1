import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { api } from '../../services/api';
import { Camera, User, School, Edit3 } from 'lucide-react';
import SettingsCard from './ui/SettingsCard';
import SettingsInput from './ui/SettingsInput';
import Button from '../ui/Button';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    faculty: '',
    avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          faculty: data.faculty || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const { data: uploadedUrl, error: uploadError } = await api.uploadImage(avatarFile, 'avatars');
        if (uploadError) throw uploadError;
        avatarUrl = uploadedUrl || '';
      }

      const { data, error } = await api.updateProfile(user!.id, {
        full_name: formData.full_name,
        username: formData.username,
        faculty: formData.faculty,
        bio: formData.bio,
        avatar_url: avatarUrl
      });

      if (error) {
        alert(error.message);
      } else {
        alert('Perfil actualizado correctamente');
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            username: data.username || '',
            bio: data.bio || '',
            faculty: data.faculty || '',
            avatar_url: data.avatar_url || ''
          });
        }
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="settings-section" style={{ padding: '4rem', textAlign: 'center' }}>Cargando perfil...</div>;

  return (
    <div className="settings-section animate-fade-in">
      <div className="settings-section-header">
        <h2>Editar Perfil</h2>
        <p>Esta información será pública para todos los usuarios.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <SettingsCard 
          title="Foto de Perfil" 
          description="Sube una foto para que otros te reconozcan."
          icon={<Camera size={24} />}
        >
          <div className="avatar-section">
            <div className="avatar-preview-container">
              <div className="avatar-preview-wrapper">
                <img src={avatarPreview || formData.avatar_url || DEFAULT_AVATAR} alt="Avatar" />
              </div>
              <label htmlFor="avatar-upload" className="avatar-upload-badge">
                <Camera size={20} />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>
            <div className="avatar-section-info">
              <Button type="button" variant="outline" size="small" onClick={() => document.getElementById('avatar-upload')?.click()}>Cambiar imagen</Button>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>JPG o PNG. Máximo 2MB.</p>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard 
          title="Información Personal" 
          description="Detalles básicos sobre ti."
          icon={<User size={24} />}
        >
          <SettingsInput 
            label="Nombre Completo"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Tu nombre real"
          />
          <SettingsInput 
            label="Nombre de Usuario"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="@usuario"
          />
        </SettingsCard>

        <SettingsCard 
          title="Vida Universitaria" 
          description="Cuéntanos sobre tu rol en la facultad."
          icon={<School size={24} />}
        >
          <SettingsInput 
            label="Facultad"
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            placeholder="Ej: Facultad de Ingeniería"
          />
        </SettingsCard>

        <SettingsCard 
          title="Acerca de mí" 
          description="Una pequeña descripción para tu perfil."
          icon={<Edit3 size={24} />}
        >
          <SettingsInput 
            label="Biografía"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Cuéntanos algo sobre ti..."
            multiline
          />
        </SettingsCard>

        <div className="form-footer">
          <Button type="submit" disabled={saving} size="large">
            {saving ? 'Guardando...' : 'Guardar Todos los Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;