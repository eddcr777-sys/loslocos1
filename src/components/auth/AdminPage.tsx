import React, { useEffect, useState } from 'react';
import { api, Profile } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import VerificationBadge from '../../components/ui/VerificationBadge';

const AdminPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data } = await api.getAllProfiles();
    if (data) setProfiles(data as any);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: 'common' | 'popular' | 'admin') => {
    // Actualización optimista (cambia la UI antes de que responda el servidor)
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, user_type: newRole } : p));

    const { error } = await api.updateProfile(userId, { user_type: newRole });
    
    if (error) {
      alert('Error al actualizar el rol: ' + error.message);
      loadProfiles(); // Revertir cambios si falla
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Panel de Administración</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Gestionar roles y permisos de usuarios.</p>

      {loading ? <p>Cargando usuarios...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {profiles.map(profile => (
            <div key={profile.id} style={styles.userRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Avatar src={profile.avatar_url} size="medium" />
                <div>
                  <strong style={{ display: 'flex', alignItems: 'center', color: '#0f172a' }}>
                    {profile.full_name}
                    <VerificationBadge type={profile.user_type} />
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{profile.user_type || 'common'}</span>
                </div>
              </div>
              
              <div>
                <select 
                  value={profile.user_type || 'common'} 
                  onChange={(e) => handleRoleChange(profile.id, e.target.value as any)}
                  style={styles.select}
                >
                  <option value="common">Común</option>
                  <option value="popular">Popular</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  userRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' },
  select: { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: '#f8fafc' }
};

export default AdminPage;