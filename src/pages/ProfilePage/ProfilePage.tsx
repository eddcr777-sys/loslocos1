import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, Post } from '../../services/api';
import PhotosSection from './PhotosSection';
import PostsSection from './PostsSection';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', avatar_url: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // New state for file
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
      loadUserPosts(profile.id);
    }
  }, [profile]);

  const loadUserPosts = async (userId: string) => {
    setLoadingPosts(true);
    const { data } = await api.getUserPosts(userId);
    if (data) setUserPosts(data as any);
    setLoadingPosts(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalAvatarUrl = editForm.avatar_url;

    if (avatarFile) {
        const { data, error } = await api.uploadImage(avatarFile, 'avatars'); // Use avatars bucket
        if (error) {
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
      refreshProfile();
    }
  };

  if (!profile) return <div>Loading Profile...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.profileHeaderContent}>
          <img 
            src={profile.avatar_url || 'https://via.placeholder.com/150'} 
            alt="Profile" 
            style={styles.profilePic} 
          />
          <div style={styles.userInfo}>
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} style={styles.editForm}>
                <input
                  type="text"
                  placeholder="Full Name"
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
                    <label style={{display: 'block', marginBottom: '5px', color: '#666'}}>Profile Picture:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        style={styles.input}
                    />
                </div>

                <div style={styles.editButtons}>
                  <button type="submit" style={styles.saveButton}>Save</button>
                  <button type="button" onClick={() => setIsEditing(false)} style={styles.cancelButton}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <h1>{profile.full_name || 'Anonymous'}</h1>
                <p style={styles.description}>{profile.bio || 'No bio yet.'}</p>
                <button onClick={() => setIsEditing(true)} style={styles.editButton}>Edit Profile</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <div style={styles.contentSections}>
          <PhotosSection posts={userPosts} loading={loadingPosts} />
          <PostsSection posts={userPosts} loading={loadingPosts} />
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    borderBottom: '1px solid #eee',
    paddingBottom: '2rem',
    marginBottom: '2rem',
  },
  profileHeaderContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '2rem',
  },
  profilePic: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  userInfo: {
    flex: 1,
  },
  description: {
    fontSize: '1.1rem',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  contentSections: {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  editButton: {
    padding: '8px 16px',
    fontSize: '0.9rem',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '400px',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
  },
  textarea: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    minHeight: '80px',
  },
  editButtons: {
    display: 'flex',
    gap: '1rem',
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default ProfilePage;