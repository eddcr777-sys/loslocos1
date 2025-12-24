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
          gap: 2rem;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .users-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f1f5f9;
          padding: 1rem 1.5rem;
          border-radius: 18px;
          border: 2px solid transparent;
          transition: all 0.3s;
          width: 100%;
          max-width: 600px;
        }
        .search-bar:focus-within {
          background: white;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .search-bar input {
          border: none;
          background: transparent;
          outline: none;
          flex: 1;
          font-size: 1rem;
          font-weight: 500;
        }
        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .user-role-card {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 1.25rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s;
        }
        .user-role-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #cbd5e1;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
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
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 8px;
        }
        .role-selector select {
          background: transparent;
          border: none;
          font-size: 0.85rem;
          font-weight: 600;
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
          .admin-users-view {
            gap: 1rem;
          }
          .users-grid {
            grid-template-columns: 1fr;
          }
          .user-role-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.25rem;
            padding: 1rem;
          }
          .role-selector {
            width: 100%;
            justify-content: center;
            padding: 10px;
          }
          .user-info {
            width: 100%;
          }
        }
        @media (max-width: 480px) {
          .search-bar {
            padding: 0.5rem 0.75rem;
          }
          .search-bar input {
            font-size: 0.85rem;
          }
          .user-meta strong {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage;