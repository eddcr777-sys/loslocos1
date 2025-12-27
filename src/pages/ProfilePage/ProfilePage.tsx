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

  if (!viewProfile) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando perfil...</div>;

  return (
    <div style={styles.container}>
      <div style={{ 
        backgroundColor: 'var(--surface-color)', 
        borderRadius: 'var(--radius-xl)', 
        padding: '2.5rem 2rem', 
        boxShadow: 'var(--shadow-md)',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.25rem',
        position: 'relative',
        border: '1px solid var(--border-color)'
      }}>
        <Avatar src={viewProfile.avatar_url} size="large" style={{ width: '128px', height: '128px', fontSize: '3.5rem', border: '4px solid var(--surface-color)', boxShadow: 'var(--shadow-lg)' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            {viewProfile.full_name}
            <VerificationBadge type={viewProfile.user_type} />
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {viewProfile.username && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                <AtSign size={14} className="text-secondary" />
                {viewProfile.username}
              </span>
            )}
            
            {viewProfile.faculty && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                <Briefcase size={14} className="text-secondary" />
                {viewProfile.faculty}
              </span>
            )}
          </div>
        </div>

        {viewProfile.bio && (
          <p style={{ maxWidth: '500px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: '0' }}>
            {viewProfile.bio}
          </p>
        )}

        <div style={{ display: 'flex', gap: '2rem', padding: '1rem 2rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{stats.posts}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Posts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{stats.followers}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Seguidores</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{stats.following}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Siguiendo</span>
          </div>
        </div>

        {user && user.id !== viewProfile.id && (
          <button
            onClick={isFollowing ? handleUnfollow : handleFollow}
            disabled={isFollowLoading}
            style={{
              ...styles.baseButton,
              ...(isFollowing ? (hoveringUnfollow ? styles.unfollowButtonHover : styles.unfollowButton) : styles.followButton)
            }}
            onMouseEnter={() => setHoveringUnfollow(true)}
            onMouseLeave={() => setHoveringUnfollow(false)}
          >
            {isFollowLoading ? 'Cargando...' : (
              isFollowing 
                ? (hoveringUnfollow ? 'Dejar de seguir' : <><UserCheck size={18} /> Siguiendo</>) 
                : <><UserPlus size={18} /> Seguir</>
            )}
          </button>
        )}

        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
           <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
             <Calendar size={14} />
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
    maxWidth: '800px',
    margin: '0 auto',
  },
  contentSections: {
    marginTop: '1.5rem'
  },
  baseButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 2rem',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    minWidth: '160px'
  },
  followButton: {
    backgroundColor: 'var(--text-primary)',
    color: 'var(--bg-color)',
  },
  unfollowButton: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  unfollowButtonHover: {
    backgroundColor: 'var(--error-soft)',
    color: 'var(--error)',
    border: '1px solid var(--error)',
  },
};


export default ProfilePage;
