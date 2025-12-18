import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, Post } from '../../services/api';
import PhotosSection from './PhotosSection';
import PostsSection from './PostsSection';
import { useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';

const ProfilePage = () => {
  const { user, profile: currentUserProfile, refreshProfile } = useAuth();
  const { userId } = useParams<{ userId: string }>(); // Get userId from URL
  
  // State for the profile being VIEWED
  const [viewProfile, setViewProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', avatar_url: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Follow System State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [loadingFollow, setLoadingFollow] = useState(false);

  // Determine if we are viewing our own profile
  const isOwnProfile = !userId || (user && userId === user.id);

  useEffect(() => {
    loadProfileData();
  }, [userId, currentUserProfile]); // Reload if URL changes or our own profile updates

  const loadProfileData = async () => {
    setLoadingPosts(true);
    
    let targetProfile = null; // The profile object we want to display

    if (isOwnProfile) {
        // Viewing self
        targetProfile = currentUserProfile;
    } else if (userId) {
        // Viewing someone else - fetch their data
        const { data } = await api.getProfileById(userId);
        targetProfile = data;
    }

    if (targetProfile) {
        setViewProfile(targetProfile);
        setEditForm({
            full_name: targetProfile.full_name || '',
            bio: targetProfile.bio || '',
            avatar_url: targetProfile.avatar_url || ''
        });

        // Load posts for this user
        const { data: postsData } = await api.getUserPosts(targetProfile.id);
        if (postsData) setUserPosts(postsData as any);

        // Load Follow Stats
        const counts = await api.getFollowCounts(targetProfile.id);
        setFollowCounts({ followers: counts.followers, following: counts.following });

        // Check if WE follow THEM (if not self)
        if (!isOwnProfile && user) {
            const status = await api.getFollowStatus(targetProfile.id, user.id);
            setIsFollowing(status.following);
        }
    }
    setLoadingPosts(false);
  };

  const handleFollowToggle = async () => {
     if (!user || !viewProfile) return;
     setLoadingFollow(true);

     if (isFollowing) {
         await api.unfollowUser(viewProfile.id, user.id);
         setIsFollowing(false);
         setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
     } else {
         await api.followUser(viewProfile.id, user.id);
         setIsFollowing(true);
         setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
         
         // Notify them
         await api.createNotification({
             user_id: viewProfile.id,
             actor_id: user.id,
             type: 'follow'
         });
     }
     setLoadingFollow(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalAvatarUrl = editForm.avatar_url;

    if (avatarFile) {
        const { data, error } = await api.uploadImage(avatarFile, 'avatars');
        if (error) {
            console.error("Avatar upload error:", error);
            alert('Error uploading avatar: ' + error.message);
            return;
        }
        finalAvatarUrl = data || '';
    }

    const { error } = await api.updateProfile(user.id, {
        ...editForm,
        avatar_url: finalAvatarUrl
    });

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      setIsEditing(false);
      setAvatarFile(null);
      refreshProfile(); // Update context
    }
  };

  if (!viewProfile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando perfil...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.profileHeaderContent}>
          <img 
            src={viewProfile.avatar_url || 'https://via.placeholder.com/150'} 
            alt="Profile" 
            style={styles.profilePic} 
          />
          <div style={styles.userInfo}>
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} style={styles.editForm}>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  style={styles.input}
                />
                <textarea
                  placeholder="Bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  style={styles.textarea}
                />
                <div style={{marginBottom: '1rem'}}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        style={styles.input}
                    />
                </div>
                <div style={styles.editButtons}>
                  <Button type="submit">Guardar</Button>
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ margin: 0 }}>{viewProfile.full_name || 'Usuario'}</h1>
                    {!isOwnProfile && (
                        <Button 
                            onClick={handleFollowToggle} 
                            disabled={loadingFollow}
                            variant={isFollowing ? 'outline' : 'primary'}
                        >
                            {isFollowing ? 'Siguiendo' : 'Seguir'}
                        </Button>
                    )}
                    {isOwnProfile && (
                        <Button variant="outline" size="small" onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                    )}
                </div>
                
                <p style={styles.description}>{viewProfile.bio || 'Sin biografía.'}</p>
                
                <div style={styles.stats}>
                    <span><strong>{userPosts.length}</strong> posts</span>
                    <span><strong>{followCounts.followers}</strong> seguidores</span>
                    <span><strong>{followCounts.following}</strong> seguidos</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <div style={styles.contentSections}>
          {/* We can hide PhotosSection to simplify or keep it */}
           <PostsSection posts={userPosts} loading={loadingPosts} />
        </div>
      </main>
    </div>
  );
};

// Simplified Styles for the new "Minimalist" look
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '2rem',
    marginBottom: '2rem',
  },
  profileHeaderContent: {
    display: 'flex',
    alignItems: 'center', // Centered vertically
    gap: '2rem',
  },
  profilePic: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--border-color)',
  },
  userInfo: {
    flex: 1,
  },
  description: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
    maxWidth: '500px',
  },
  stats: {
    display: 'flex',
    gap: '2rem',
    fontSize: '0.95rem',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '400px',
  },
  input: {
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    fontSize: '1rem',
  },
  textarea: {
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    fontSize: '1rem',
    minHeight: '80px',
  },
  editButtons: {
    display: 'flex',
    gap: '1rem',
  },
};

export default ProfilePage;