import React from 'react';
import { useParams } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import PostsSection from './PostsSection';
import ProfileHeader from './components/ProfileHeader';
import ProfileEditForm from './components/ProfileEditForm';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const {
    viewProfile,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    setAvatarFile,
    userPosts,
    loadingPosts,
    isFollowing,
    followCounts,
    loadingFollow,
    isOwnProfile,
    handleFollowToggle,
    handleUpdateProfile
  } = useProfile(userId);

  if (!viewProfile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando perfil...</div>;

  return (
    <div style={styles.container}>
      {isEditing ? (
        <div style={{ padding: '2rem 0' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Editar Perfil</h2>
            <ProfileEditForm 
                editForm={editForm}
                setEditForm={setEditForm}
                setAvatarFile={setAvatarFile}
                onSubmit={handleUpdateProfile}
                onCancel={() => setIsEditing(false)}
            />
        </div>
      ) : (
        <ProfileHeader 
          viewProfile={viewProfile}
          isOwnProfile={isOwnProfile ?? false}
          isFollowing={isFollowing}
          loadingFollow={loadingFollow}
          onFollowToggle={handleFollowToggle}
          onEditClick={() => setIsEditing(true)}
          postCount={userPosts.length}
          followCounts={followCounts}
        />
      )}
      
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
  }
};

export default ProfilePage;
