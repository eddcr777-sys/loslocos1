import React from 'react';
import { Post } from '../../services/api';

interface PhotosSectionProps {
  posts: Post[];
  loading: boolean;
}

const PhotosSection: React.FC<PhotosSectionProps> = ({ posts, loading }) => {
  const photos = posts.filter(post => post.image_url);

  return (
    <section style={styles.section}>
      <h2>Mis Fotos</h2>
      <div style={styles.photosContainer}>
        {loading ? (
          <p>Cargando fotos...</p>
        ) : photos.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>No hay fotos aún.</p>
        ) : (
          photos.map((post) => (
            <div key={post.id} style={styles.photoItem}>
              <img src={post.image_url!} alt="Post" style={styles.image} />
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  section: {
    marginBottom: '2rem',
    flex: 1,
    minWidth: '300px',
  },
  photosContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '0.5rem',
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '0.5rem',
    border: '1px solid #eee',
    borderRadius: '8px',
  },
  photoItem: {
    width: '100%',
    aspectRatio: '1 / 1',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
};

export default PhotosSection;