import React from 'react';
import { useFeed } from '../../context/FeedContext';
import CreatePost from '../../components/posts/CreatePost';
import Post from '../../components/posts/Post';
import './HomePage.css';

function HomePage() {
  const { posts, loading, refreshFeed } = useFeed();

  // CreatePost now handles creation via context if we refactor it, 
  // currently CreatePost calls API directly. 
  // Ideally CreatePost should also use Context or just trigger refresh.
  // Let's pass refreshFeed as prop to CreatePost as it expects onPostCreated.

  return (
    <div className="home-container">
      <div className="feed-container">
        <CreatePost onPostCreated={refreshFeed} />
        
        {loading ? (
          <p>Loading feed...</p>
        ) : (
          posts.map((post) => (
            <Post key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

export default HomePage;