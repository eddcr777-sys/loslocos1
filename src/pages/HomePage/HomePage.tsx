import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  const pullThreshold = 80; // Standard native threshold
  const maxPull = 120; // Max visual distance

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY > 0 && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY;
      if (diff > 0) {
        // Logarithmic resistance for a 'native' feel
        const resistance = 0.5;
        const constrainedDiff = Math.min(diff * resistance, maxPull);
        setPullMoveY(constrainedDiff);
      }
    }
  }, [pullStartY]);

  const handleTouchEnd = useCallback(async () => {
    if (pullMoveY >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullMoveY(60); // Position while loading
      await refreshFeed();
      setIsRefreshing(false);
    }
    setPullStartY(0);
    setPullMoveY(0);
  }, [pullMoveY, isRefreshing, refreshFeed]);

  // Filtrado según la pestaña activa
  const baseFilteredPosts = posts.filter(post => {
    if (activeTab === 'avisos') return post.is_official === true;
    return true; 
  });

  const processedPosts = useMemo(() => {
    const sortedPosts = [...baseFilteredPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const result: any[] = [];
    const entriesMap = new Map<string, any>();

    sortedPosts.forEach(post => {
        const isShare = post.item_type === 'share' || (post.original_post && !post.content && !post.is_quote);
        const isQuote = post.item_type === 'quote' || post.is_quote;
        
        const originalId = isShare ? (post.original_post ? post.original_post.id : post.original_post_id) : post.id;
        
        if (!originalId) return;

        if (isQuote) {
            result.push({ main: post, reposters: [] });
            return;
        }

        if (entriesMap.has(originalId)) {
            const entry = entriesMap.get(originalId);
            if (isShare) {
                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                if (profile && !entry.reposters.some((r: any) => r.id === profile.id)) {
                    entry.reposters.push(profile);
                }
            } else {
                entry.main = { ...entry.main, ...post };
            }
        } else {
            const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
            const entry = {
                main: isShare && post.original_post ? post.original_post : post,
                reposters: isShare && profile ? [profile] : [],
                isRepostGroup: isShare
            };
            entriesMap.set(originalId, entry);
            result.push(entry);
        }
    });
    return result;
  }, [baseFilteredPosts]);


  return (
    <div 
        className="home-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <WelcomeModal />
      
      {/* Native-style Pull to Refresh Indicator (Overlay) */}
      <div style={{
          position: 'fixed',
          top: `calc(${pullMoveY}px + env(safe-area-inset-top) + 10px)`,
          left: '50%',
          transform: `translateX(-50%) scale(${Math.min(pullMoveY / 40, 1)})`,
          zIndex: 2000,
          opacity: pullMoveY > 20 ? 1 : 0,
          transition: isRefreshing ? 'top 0.2s, opacity 0.2s' : (pullMoveY === 0 ? 'all 0.3s ease' : 'none'),
          pointerEvents: 'none'
      }}>
           <div className="glass" style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-color)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color)'
           }}>
             <Loader2 
                size={22} 
                color="var(--accent-color)" 
                style={{ 
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    transform: isRefreshing ? 'none' : `rotate(${pullMoveY * 5}deg)`,
                    opacity: 0.8
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="post-card" style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="skeleton skeleton-avatar" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '20%' }} />
                  </div>
                </div>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-image" style={{ marginTop: '1rem' }} />
              </div>
            ))}
          </div>
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