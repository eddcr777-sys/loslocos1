import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeed } from '../../context/FeedContext';
import CreatePost from '../CrearPost/CreatePost';
import Post from '../../components/posts/Post';
import './HomePage.css'; 


import Stories from '../../components/layout/Stories';
import FeedFilters from '../../components/layout/FeedFilters';

import WelcomeModal from '../../components/layout/WelcomeModal';

function HomePage() {
  const { posts, loading, refreshFeed, activeTab } = useFeed();
  
  // Pull to Refresh State
  const [pullStartY, setPullStartY] = useState(0);
  const [pullMoveY, setPullMoveY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullThreshold = 120; // px to trigger refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0 && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY;
      if (diff > 0) {
        setPullMoveY(diff);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullMoveY > pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullMoveY(pullThreshold); // Lock visual position
      await refreshFeed();
      setIsRefreshing(false);
    }
    setPullStartY(0);
    setPullMoveY(0);
  };

  // Filtrado según la pestaña activa
  const baseFilteredPosts = posts.filter(post => {
    if (activeTab === 'avisos') return post.is_official === true;
    return true; 
  });

  // AGGREGATION ALGORITHM
  // We use a Map to group reposts of the same original post.
  // We also track processed IDs to avoid showing the same content twice.
  const processedPosts: any[] = [];
  const entriesMap = new Map<string, any>(); // original_post_id -> entry index in processedPosts

  const sortedPosts = [...baseFilteredPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  sortedPosts.forEach(post => {
      const isShare = post.item_type === 'share' || (post.original_post && !post.content && !post.is_quote);
      const isQuote = post.item_type === 'quote' || post.is_quote;
      
      const originalId = isShare ? (post.original_post ? post.original_post.id : post.original_post_id) : post.id;
      
      if (!originalId) return;

      // Quotes are unique pieces of content, they DON'T merge with other things
      if (isQuote) {
          processedPosts.push({ main: post, reposters: [] });
          return;
      }

      // Check if this (Original) post content is already in the feed
      if (entriesMap.has(originalId)) {
          const entry = entriesMap.get(originalId);
          
          if (isShare) {
              // Add this reposter to the existing entry
              const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
              if (profile && !entry.reposters.some((r: any) => r.id === profile.id)) {
                  entry.reposters.push(profile);
              }
          } else {
              // This is the actual post content. 
              // We might want to prefer the data from the 'post' object over the 'share.original_post' object
              // if it has more up-to-date counts.
              entry.main = { ...entry.main, ...post }; // Merge data, prioritizing post record counts
          }
      } else {
          // New entry
          const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
          const entry = {
              main: isShare && post.original_post ? post.original_post : post,
              reposters: isShare && profile ? [profile] : [],
              isRepostGroup: isShare
          };
          entriesMap.set(originalId, entry);
          processedPosts.push(entry);
      }
  });


  return (
    <div 
        className="home-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <WelcomeModal />
      
      {/* Pull to Refresh Indicator */}
      <div style={{
          height: `${Math.min(pullMoveY, pullThreshold)}px`,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: isRefreshing ? 'height 0.2s' : 'height 0s',
          backgroundColor: 'var(--bg-color)',
          color: 'var(--text-secondary)'
      }}>
           <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--card-bg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${Math.min(pullMoveY / pullThreshold, 1)})`,
                transition: 'transform 0.1s ease-out'
           }}>
             <Loader2 
                size={20} 
                color="var(--primary-color)" 
                style={{ 
                    animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
                    transform: isRefreshing ? 'none' : `rotate(${pullMoveY * 2}deg)`
                }}
             />
           </div>
      </div>

      <div className="feed-container">
        <Stories />
        <FeedFilters />

        {/* CreatePost handles normal creation */}
        <CreatePost 
            onPostCreated={() => {
                refreshFeed();
            }} 
        />

        {loading ? (
          <p>Cargando publicaciones...</p>
        ) : (
          processedPosts.map(({ main, reposters }) => (
            <Post 
                key={main.id} 
                post={main} 
                reposters={reposters}
                onPostDeleted={refreshFeed} 
            />
          ))
        )}
      </div>
    </div>
  );
}

export default HomePage;