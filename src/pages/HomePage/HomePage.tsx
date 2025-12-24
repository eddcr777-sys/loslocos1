import React from 'react';
import { useFeed } from '../../context/FeedContext';
import CreatePost from '../../components/posts/CreatePost';
import Post from '../../components/posts/Post';
import './HomePage.css'; 
import Logo from '../../components/ui/logo';

import Stories from '../../components/layout/Stories';
import FeedFilters from '../../components/layout/FeedFilters';

function HomePage() {
  const { posts, loading, refreshFeed } = useFeed();

  return (
    <div className="home-container">
      <div className="feed-container">
        <Stories />
        <FeedFilters />
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