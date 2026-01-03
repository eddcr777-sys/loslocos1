import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { supabase } from '../utils/supabaseClient';

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // 1. Check session
        const { data: { session } } = await supabase.auth.getSession();
        
        // 2. Check profile
        let profile = null;
        if (session?.user) {
          const { data } = await api.getProfile(session.user.id);
          profile = data;
        }

        // 3. Check posts
        const { data: posts, error: postsError } = await api.getPosts();
        
        // 4. Check smart feed
        const { data: smartFeed, error: smartFeedError } = await api.getSmartFeed();

        // 5. Check followers
        let followers = [];
        if (session?.user) {
          const { data } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', session.user.id);
          followers = data || [];
        }

        setDebugInfo({
          session: !!session,
          userId: session?.user?.id,
          profile: profile,
          postsCount: posts?.length || 0,
          postsError: postsError?.message,
          smartFeedCount: smartFeed?.length || 0,
          smartFeedError: smartFeedError?.message,
          followingCount: followers.length,
          posts: posts?.slice(0, 3), // First 3 posts
          smartFeed: smartFeed?.slice(0, 3), // First 3 from smart feed
        });
      } catch (error: any) {
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, []);

  if (loading) return <div style={{ padding: '20px', background: '#f0f0f0', margin: '10px', borderRadius: '8px' }}>Cargando información de depuración...</div>;

  return (
    <div style={{ 
      padding: '20px', 
      background: '#1a1a1a', 
      color: '#fff', 
      margin: '10px', 
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <h3 style={{ marginTop: 0 }}>🔍 Panel de Depuración</h3>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

export default DebugPanel;
