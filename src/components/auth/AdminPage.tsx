import React, { useEffect, useState } from 'react';
import { api, Profile } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import VerificationBadge from '../../components/ui/VerificationBadge';
import { Search, UserCog, Loader2 } from 'lucide-react';
import './AdminPage.css';



const AdminPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data } = await api.getAllProfiles();
    if (data) setProfiles(data as any);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, user_type: newRole } : p));
    const { error } = await api.updateProfile(userId, { user_type: newRole });
    if (error) {
      alert('Error al actualizar el rol: ' + error.message);
      loadProfiles();
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-users-view">
      <div className="users-header">
        <div className="search-bar">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Buscar usuario por nombre o @usuario..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="users-list-container">
        {loading ? (
          <div className="loading-state">
              <Loader2 size={32} className="animate-spin" />
              <span>Sincronizando directorio...</span>
          </div>
        ) : (
          <div className="users-grid">
            {filteredProfiles.map(profile => (
              <div key={profile.id} className="user-role-card">
                <div className="user-info">
                  <Avatar src={profile.avatar_url} size="medium" />
                  <div className="user-meta">
                    <div className="name-box">
                      <strong>{profile.full_name}</strong>
                      <VerificationBadge type={profile.user_type} />
                    </div>
                    <span>{profile.faculty || 'Sin facultad'}</span>
                  </div>
                </div>
                
                <div className="role-selector">
                  <div className="role-icon-label"><UserCog size={16} /></div>
                  <select 
                    value={profile.user_type || 'common'} 
                    onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                    className="role-select-input"
                  >
                    <option value="common">Estudiante</option>
                    <option value="popular">Influencer / Popular</option>
                    <option value="institutional">Institucional / Staff</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;