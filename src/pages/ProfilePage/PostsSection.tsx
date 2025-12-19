import React from 'react';
import { Post as PostType } from '../../services/api';
import Post from '../../components/posts/Post';

interface PostsSectionProps {
  posts: PostType[];
  loading: boolean;
}

const PostsSection: React.FC<PostsSectionProps> = ({ posts, loading }) => {
  return (
    <section style={styles.section}>
      <h2 style={{ marginBottom: '1rem' }}>Publicaciones</h2>
      <div style={styles.postsContainer}>
        {loading ? (
          <p>Cargando posts...</p>
        ) : posts.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>No hay publicaciones aún.</p>
        ) : (
          posts.map((post) => (
            <Post key={post.id} post={post} />
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
    gap: '0',
  },
};

export default PostsSection;