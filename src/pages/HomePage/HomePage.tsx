import React, { useState } from 'react';
import { useFeed } from '../../context/FeedContext';
import CreatePost from '../CrearPost/CreatePost';
import Post from '../../components/posts/Post';
import './HomePage.css'; 
import Logo from '../../components/ui/logo';

import Stories from '../../components/layout/Stories';
import FeedFilters from '../../components/layout/FeedFilters';

import WelcomeModal from '../../components/layout/WelcomeModal';

function HomePage() {
  const { posts, loading, refreshFeed, activeTab } = useFeed();
  const [quotePost, setQuotePost] = useState<any>(null); // State for post being quoted

  // Filtrado según la pestaña activa
  const baseFilteredPosts = posts.filter(post => {
    if (activeTab === 'avisos') return post.is_official === true;
    return true; 
  });

  // AGGREGATION ALGORITHM
  // 1. Group Reposts by original_post_id
  const processedPosts: any[] = [];
  const repostsMap = new Map<string, { main: any, reposters: any[] }>();
  const processedIds = new Set<string>();

  // Sort by date descending first (assuming 'posts' is already sorted, but good to be safe)
  const sortedPosts = [...baseFilteredPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  sortedPosts.forEach(post => {
      // If it's a "Repost" (has original_post but no content)
      if (post.original_post && !post.content) {
          const originalId = post.original_post.id;
          
          if (repostsMap.has(originalId)) {
               // Existing group found, add reposter
               // Ensure profiles is an object, though api.ts should now guarantee it.
               const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
               if (profile) {
                   repostsMap.get(originalId)?.reposters.push(profile);
               }
          } else {
              // New Repost Group
              const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
              const entry = {
                  main: post, 
                  reposters: profile ? [profile] : []
              };
              repostsMap.set(originalId, entry);
              processedPosts.push(entry);
          }
      } else {
          // Normal Post or Quote (Quotes are treated as unique posts)
          processedPosts.push({ main: post, reposters: [] });

          // Optimization: If we encounter the ORIGINAL post later (or earlier), we might want to merge logic.
          // But strict logic: If the Original Post is ALSO in the feed, we should probably prefer showing the Original Post card
          // and attaching "X reposted this" to it.
          // Current simplified logic: Reposts group with Reposts. Original stays separate if it appears.
      }
  });


  return (
    <div className="home-container">
      <WelcomeModal />
      <div className="feed-container">
        <Stories />
        <FeedFilters />

        {/* CreatePost now handles normal creation AND Quoting */}
        <CreatePost 
            onPostCreated={() => {
                refreshFeed();
                setQuotePost(null);
            }} 
            quotedPost={quotePost}
            onCancelQuote={() => setQuotePost(null)}
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
                onRepost={(p) => {
                    setQuotePost(p);
                    // Scroll to top to see CreatePost?
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default HomePage;