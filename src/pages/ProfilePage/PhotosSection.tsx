import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, Post } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PhotosSection = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Si hay un userId en la URL, usamos ese. Si no, usamos el del usuario autenticado.
  const targetId = userId || user?.id;

  useEffect(() => {
    if (!targetId) return;

    const fetchPhotos = async () => {
      setLoading(true);
      // Reutilizamos la función getUserPosts que ya trae las publicaciones del usuario
      const { data } = await api.getUserPosts(targetId);
      if (data) {
        // Filtramos solo las publicaciones que tienen imagen (image_url no es null)
        const postsWithImages = (data as Post[]).filter(post => post.image_url);
        setPhotos(postsWithImages);
      }
      setLoading(false);
    };

    fetchPhotos();
  }, [targetId]);

  if (loading) {
    return (
        <div style={styles.section}>
            <p style={{ textAlign: 'center', color: '#65676b' }}>Cargando fotos...</p>
        </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div style={styles.section}>
        <h2 style={styles.title}>Fotos</h2>
        <p style={{ color: '#65676b', textAlign: 'center', fontSize: '0.9rem' }}>No hay fotos para mostrar.</p>
      </div>
    );
  }

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>Fotos</h2>
      <div style={styles.photosContainer}>
        {photos.map((photo) => (
          <div key={photo.id} style={styles.photoItem}>
            <img src={photo.image_url!} alt="Foto de usuario" style={styles.image} />
          </div>
        ))}
      </div>
    </section>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  section: {
    marginBottom: '1.5rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #ddd',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#050505',
    marginTop: 0,
  },
  photosContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
  },
  photoItem: {
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    borderRadius: '4px',
    border: '1px solid #eee',
    cursor: 'pointer',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.2s',
  },
};

export default PhotosSection;