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