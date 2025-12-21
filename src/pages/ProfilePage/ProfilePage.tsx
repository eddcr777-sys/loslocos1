import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFullProfile } from '../../hooks/useFullProfile';
import PostsSection from './PostsSection';
import Avatar from '../../components/ui/Avatar';
import VerificationBadge from '../../components/ui/VerificationBadge';
import { Calendar, Briefcase, AtSign, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const {
    viewProfile,
    userPosts,
    loadingPosts,
    isFollowing,
    isFollowLoading,
    stats,
    handleFollow,
    handleUnfollow
  } = useFullProfile(userId, user);

  const [hoveringUnfollow, setHoveringUnfollow] = useState(false);

  if (!viewProfile) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando perfil...</div>;

  return (
    <div style={styles.container}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        padding: '2rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1rem',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
          {user && user.id !== viewProfile.id && (
            <button
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={isFollowLoading}
              style={isFollowing ? (hoveringUnfollow ? styles.unfollowButtonHover : styles.unfollowButton) : styles.followButton}
              onMouseEnter={() => setHoveringUnfollow(true)}
              onMouseLeave={() => setHoveringUnfollow(false)}
            >
              {isFollowLoading ? 'Cargando...' : (
                isFollowing 
                  ? (hoveringUnfollow ? 'Dejar de seguir' : <><UserCheck size={16} /> Siguiendo</>) 
                  : <><UserPlus size={16} /> Seguir</>
              )}
            </button>
          )}
        </div>
        <Avatar src={viewProfile.avatar_url} size="large" style={{ width: '120px', height: '120px', fontSize: '3rem' }} />
        
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#1e293b' }}>
            {viewProfile.full_name}
            <VerificationBadge type={viewProfile.user_type} />
          </h1>
          
          {/* Nombre de usuario y Facultad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', color: '#64748b' }}>
            {viewProfile.username && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1rem' }}>
                <AtSign size={16} />
                {viewProfile.username}
              </span>
            )}
            
            {viewProfile.faculty && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1rem' }}>
                <Briefcase size={16} />
                {viewProfile.faculty}
              </span>
            )}
          </div>
        </div>

        {viewProfile.bio && (
          <p style={{ maxWidth: '600px', lineHeight: '1.6', color: '#334155' }}>
            {viewProfile.bio}
          </p>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', color: '#475569', fontSize: '1rem', marginTop: '0.5rem' }}>
          <span><strong>{stats.posts}</strong> Posts</span>
          <span><strong>{stats.followers}</strong> Seguidores</span>
          <span><strong>{stats.following}</strong> Siguiendo</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem', flexWrap: 'wrap', justifyContent: 'center' }}>
           <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
             <Calendar size={16} />
             Se unió en {new Date(viewProfile.created_at).toLocaleDateString()}
           </span>
        </div>
      </div>
      
      <main>
        <div style={styles.contentSections}>
          <PostsSection posts={userPosts} loading={loadingPosts} />
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '1rem', 
    maxWidth: '100%',
    margin: '0 auto',
    overflowX: 'hidden' 
  },
  contentSections: {
    marginTop: '1rem'
  },
  followButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#000000ff',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '9999px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s',
  },
  unfollowButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    color: '#334155',
    border: '1px solid #e2e8f0',
    padding: '0.6rem 1.2rem',
    borderRadius: '9999px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s, color 0.2s',
  },
  unfollowButtonHover: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '0.6rem 1.2rem',
    borderRadius: '9999px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s, color 0.2s',
  },
};

export default ProfilePage;
