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
      <h2 style={{ marginBottom: '1rem', display: 'none' }}>Publicaciones</h2>
      <div style={styles.postsContainer}>
        {loading ? (
          <div className="skeleton-loader" style={{ height: '200px' }}></div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
             <p>No hay publicaciones aún.</p>
          </div>
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