import React from 'react';
import { useFeed } from '../../context/FeedContext';
import CreatePost from '../../components/posts/CreatePost';
import Post from '../../components/posts/Post';
import './HomePage.css'; 

function HomePage() {
  const { posts, loading, refreshFeed } = useFeed();

  return (
    <div className="home-container">
      <div className="feed-container">
        <CreatePost onPostCreated={refreshFeed} />
        
        {loading ? (
          <p>Cargando publicaciones...</p>
        ) : (
          [...posts]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((post) => (
            <Post key={post.id} post={post} onPostDeleted={refreshFeed} />
          ))
        )}
      </div>
    </div>
  );
}

export default HomePage;