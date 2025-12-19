import React from 'react';
import VerificationBadge from '../../../components/ui/VerificationBadge';
import Button from '../../../components/ui/Button';

interface ProfileHeaderProps {
  viewProfile: any;
  isOwnProfile: boolean;
  isFollowing: boolean;
  loadingFollow: boolean;
  onFollowToggle: () => void;
  onEditClick: () => void;
  postCount: number;
  followCounts: { followers: number; following: number };
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  viewProfile,
  isOwnProfile,
  isFollowing,
  loadingFollow,
  onFollowToggle,
  onEditClick,
  postCount,
  followCounts
}) => {
  return (
    <header style={styles.header}>
      {isOwnProfile && (
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <Button variant="outline" size="small" onClick={onEditClick}>Editar Perfil</Button>
        </div>
      )}
      <div style={styles.profileHeaderContent}>
        <img 
          src={viewProfile.avatar_url || 'https://via.placeholder.com/150'} 
          alt="Profile" 
          style={styles.profilePic} 
        />
        <div style={styles.userInfo}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                {viewProfile.full_name || 'Usuario'}
                <VerificationBadge type={viewProfile.user_type} size={24} />
              </h1>
              {!isOwnProfile && (
                  <Button 
                      onClick={onFollowToggle} 
                      disabled={loadingFollow}
                      variant={isFollowing ? 'outline' : 'primary'}
                  >
                      {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </Button>
              )}
          </div>
          
          <p style={styles.description}>{viewProfile.bio || 'Sin biografía.'}</p>
          
          <div style={styles.stats}>
              <span><strong>{postCount}</strong> posts</span>
              <span><strong>{followCounts.followers}</strong> seguidores</span>
              <span><strong>{followCounts.following}</strong> seguidos</span>
          </div>
        </div>
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '2rem',
    marginBottom: '2rem',
    position: 'relative',
  },
  profileHeaderContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    textAlign: 'center',
  },
  profilePic: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--border-color)',
  },
  userInfo: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  description: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
    maxWidth: '500px',
    lineHeight: '1.5'
  },
  stats: {
    display: 'flex',
    gap: '1.5rem',
    fontSize: '0.9rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
};

export default ProfileHeader;
