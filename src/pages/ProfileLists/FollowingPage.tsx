import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, UserPlus } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';

import Avatar from '../../components/ui/Avatar';
import VerificationBadge from '../../components/ui/VerificationBadge';
import './ProfileLists.css';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  faculty: string | null;
  user_type?: string;
}

const FollowingPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [following, setFollowing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Resolver el ID real de forma segura
        let profileData = null;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');

        if (isUUID) {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', userId)
            .maybeSingle();
          profileData = data;
        }

        if (!profileData) {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('username', userId)
            .maybeSingle();
          profileData = data;
        }
        
        if (!profileData) {
            console.error('Perfil no encontrado');
            setLoading(false);
            return;
        }

        const actualId = profileData.id;
        setProfileName(profileData.full_name);

        const { data, error } = await api.getFollowing(actualId);

        if (error) throw error;
        if (data) setFollowing(data as any);


      } catch (error) {
        console.error('Error al cargar seguidos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <div className="profile-list-container">
      <div className="back-button-container">
        <Button variant="ghost" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
          <span style={{ marginLeft: '0.5rem' }}>Volver</span>
        </Button>
      </div>

      <div className="list-header">
        <div style={{ background: 'var(--accent-soft)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-color)' }}>
            <UserPlus size={24} />
        </div>
        <div>
            <h1 className="list-title">Siguiendo</h1>
            {profileName && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>de {profileName}</p>}
        </div>
      </div>

      <div className="users-list">
        {loading ? (
          <div className="loading-state">
             <div className="animate-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-color)' }}></div>
            <p>Cargando lista...</p>
          </div>
        ) : following.length > 0 ? (
          following.map((user) => (
            <Link key={user.id} to={`/profile/${user.id}`} className="user-card">
              <Avatar src={user.avatar_url} size="medium" />
              <div className="user-info" style={{ marginLeft: '1rem' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="user-fullname">{user.full_name}</span>
                    <VerificationBadge type={user.user_type as any} />
                </div>
                <span className="user-username">@{user.username}</span>
                {user.faculty && <span className="user-faculty">{user.faculty}</span>}
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-message">
            <UserPlus size={48} className="empty-icon" />
            <p>Este usuario aún no sigue a nadie.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingPage;