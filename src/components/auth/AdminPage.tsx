import React, { useEffect, useState } from 'react';
import { api, Profile } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import VerificationBadge from '../../components/ui/VerificationBadge';
import { Search, UserCog } from 'lucide-react';

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
          <Search size={18} />
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
          <div className="loading-state">Obteniendo base de datos...</div>
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
                  <UserCog size={16} />
                  <select 
                    value={profile.user_type || 'common'} 
                    onChange={(e) => handleRoleChange(profile.id, e.target.value)}
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

      <style>{`
        .admin-users-view {
          display: flex;
          flex-direction: column;
          gap: 3.5rem; /* Massive gap between header and grid */
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        .users-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
          margin-bottom: 2rem;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #f1f5f9;
          padding: 1.5rem 2.5rem; /* Enormous search bar */
          border-radius: 28px;
          border: 2px solid transparent;
          transition: all 0.3s;
          width: 100%;
          max-width: 800px;
        }
        .search-bar:focus-within {
          background: white;
          border-color: #2563eb;
          box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.1);
        }
        .search-bar input {
          border: none;
          background: transparent;
          outline: none;
          flex: 1;
          font-size: 1.25rem; /* Massive input text */
          font-weight: 600;
        }
        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 2.5rem; /* More gap between user cards */
        }
        .user-role-card {
          padding: 2.5rem;
          border-radius: 32px;
          background: white;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .user-role-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #cbd5e1;
        }
        .user-main-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .user-main-info img {
          width: 64px;
          height: 64px;
          border-radius: 20px;
        }
        .name-box {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .user-meta span {
          font-size: 0.8rem;
          color: #64748b;
        }
        .role-selector {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid #f8fafc;
        }
        .role-selector label {
          font-size: 0.85rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 8px;
        }
        .role-selector select {
          background: transparent;
          padding: 1rem;
          border-radius: 14px;
          border: 2px solid #f1f5f9;
          font-weight: 700;
          font-size: 1rem;
          color: #1e293b;
          cursor: pointer;
          outline: none;
        }
        .loading-state {
          text-align: center;
          padding: 3rem;
          color: #64748b;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .admin-users-view { padding: 8px; gap: 1.5rem; width: 100%; }
          .users-header { gap: 1rem; margin-bottom: 1rem; width: 100%; }
          .search-bar { padding: 0.85rem 1.25rem; border-radius: 16px; max-width: 100%; }
          .search-bar input { font-size: 1rem; }
          .users-grid { grid-template-columns: 1fr; gap: 0.75rem; width: 100%; }
          .user-role-card { padding: 1.5rem; border-radius: 20px; gap: 1.5rem; }
          .user-main-info { gap: 1rem; }
          .user-main-info img { width: 44px; height: 44px; border-radius: 12px; }
          .name-box strong { font-size: 1rem; }
          .role-selector { padding-top: 1rem; gap: 0.75rem; }
          .role-selector label { font-size: 0.7rem; padding: 4px 8px; }
          .role-selector select { padding: 0.85rem; font-size: 0.95rem; border-radius: 12px; }
        }
        @media (max-width: 480px) {
          .admin-users-view { padding: 4px; }
          .user-role-card { padding: 1.25rem; }
          .search-bar { padding: 0.75rem 1rem; }
        }
      `}</style>
    </div>
  );
};

export default AdminPage;