import React from 'react';
import { Post } from '../../services/api';

interface PostsSectionProps {
  posts: Post[];
  loading: boolean;
}

const PostsSection: React.FC<PostsSectionProps> = ({ posts, loading }) => {
  return (
    <section style={styles.section}>
      <h2>Mis Publicaciones</h2>
      <div style={styles.postsContainer}>
        {loading ? (
          <p>Cargando posts...</p>
        ) : posts.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>No hay publicaciones aún.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={styles.postItem}>
              <p style={{ margin: 0 }}>{post.content}</p>
              <small style={{ color: '#999', marginTop: '0.5rem', display: 'block' }}>
                {new Date(post.created_at).toLocaleDateString()}
              </small>
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
  postsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '1rem',
    border: '1px solid #eee',
    borderRadius: '8px',
  },
  postItem: {
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
};

export default PostsSection;