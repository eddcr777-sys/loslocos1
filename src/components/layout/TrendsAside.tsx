import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, MessageCircle, TrendingUp, Star, Plus, Heart, Share2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import FloatingActionButton from '../ui/FloatingActionButton';
import CreatePostModal from '../../modals/CreatePostModal';
import { api } from '../../services/api';
import './TrendsAside.css';

const TrendsAside = () => {
  const [featuredUser, setFeaturedUser] = useState<any>(null);
  const [featuredPost, setFeaturedPost] = useState<any>(null);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrendsData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Forzar actualización de tendencias en DB (Opcional, pero asegura frescura)
      await api.updateTrendingPosts();

      // 2. Obtener posts tendencia desde el RPC optimizado
      const { data: trendingPosts, error: trendingError } = await api.getTrendingPosts('day');
      
      let postsToUse = trendingPosts || [];

      // FALLBACK: Si no hay tendencias "reales", usar posts más recientes con algo de interacción
      if (!trendingError && postsToUse.length === 0) {
          const { data: fallbackPosts } = await supabase
            .from('posts')
            .select(`
                *,
                author_data:profiles!user_id (id, full_name, avatar_url, user_type, username, faculty),
                likes (count),
                comments (count),
                shares (count)
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (fallbackPosts) {
              postsToUse = fallbackPosts.map(p => ({
                   ...p,
                   likes_count: p.likes?.[0]?.count || 0,
                   comments_count: p.comments?.[0]?.count || 0,
                   shares_count: p.shares?.[0]?.count || 0,
                   quotes_count: 0,
                   score: 0
              }));
          }
      }

      if (postsToUse.length > 0) {
          // Tomar el mejor post para el widget
          const topPost = postsToUse[0];
          setFeaturedPost({
              id: topPost.id,
              author: (topPost.author_data as any)?.full_name || 'Usuario',
              content: topPost.content,
              likes: parseInt(topPost.likes_count || '0'),
              comments: parseInt(topPost.comments_count || '0'),
              shares: parseInt(topPost.shares_count || '0'),
              quotes: parseInt(topPost.quotes_count || '0'),
              reason: 'Post top del día'
          });

          // 3. Usuario Destacado
          const topUser = topPost.author_data;
          if (topUser) {
              setFeaturedUser({
                  id: topUser.id,
                  name: topUser.full_name || 'Usuario',
                  handle: topUser.username ? `@${topUser.username}` : '@usuario',
                  faculty: topUser.faculty || 'Comunidad',
                  reason: 'Más activo del día'
              });
          }
      }

      // 4. Temas (Hashtags) - Ampliamos a 30 días para asegurar que salgan temas
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('content')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(300);

      const hashtagCounts: Record<string, number> = {};
      (recentPosts || []).forEach(post => {
          const tags = post.content?.match(/#[a-zA-Z0-9_ñáéíóú]+/g);
          if (tags) {
              tags.forEach((tag: string) => {
                  hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
              });
          }
      });

      const sortedTopics = Object.entries(hashtagCounts)
          .map(([name, count]) => ({ name, posts: `${count} posts` }))
          .sort((a, b) => parseInt(b.posts) - parseInt(a.posts))
          .slice(0, 3);
      
      setTrendingTopics(sortedTopics);

    } catch (error) {
      console.error('Error fetching trends aside:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendsData();
    
    // --- REALTIME FOR TRENDS ---
    const channels = ['posts', 'likes', 'comments', 'shares', 'quotes'].map(table => 
      supabase
        .channel(`trends-refresh-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchTrendsData();
        })
        .subscribe()
    );

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchTrendsData]);

  if (loading) return (
      <aside className="trends-aside">
          <div className="trends-widget">
              <h2 className="trends-title">Cargando tendencias...</h2>
          </div>
      </aside>
  );

  return (
    <aside className="trends-aside">
      <div className="trends-widget">
        <h2 className="trends-title">Tendencias para ti</h2>
        
        <div className="trends-list">
          {/* Usuario Destacado */}
          {featuredUser && (
            <Link to={`/profile/${featuredUser.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="trend-item featured-item">
                    <div className="trend-header">
                    <Star size={16} className="trend-icon" />
                    <span className="trend-label">{featuredUser.reason}</span>
                    </div>
                    <div className="trend-content">
                    <span className="trend-name">{featuredUser.name}</span>
                    <span className="trend-meta">{featuredUser.handle} • {featuredUser.faculty}</span>
                    </div>
                </div>
            </Link>
          )}

          {/* Publicación Destacada */}
          {featuredPost && (
            <Link to={`/post/${featuredPost.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="trend-item featured-item">
                <div className="trend-header">
                <MessageCircle size={16} className="trend-icon" />
                <span className="trend-label">{featuredPost.reason}</span>
                </div>
                <div className="trend-content">
                <span className="trend-name">{featuredPost.author}</span>
                <p className="trend-snippet">"{featuredPost.content?.substring(0, 50)}{featuredPost.content?.length > 50 ? '...' : ''}"</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Heart size={14} /> {featuredPost.likes}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageCircle size={14} /> {featuredPost.comments}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Share2 size={14} /> {featuredPost.shares + featuredPost.quotes}
                  </span>
                </div>
                </div>
            </div>
            </Link>

          )}

          {/* Hashtags / Temas */}
          {trendingTopics.map((trend, index) => (
            <Link key={index} to={`/search?q=${trend.name.replace('#', '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="trend-item">
                <div className="trend-header">
                    <TrendingUp size={16} className="trend-icon" />
                    <span className="trend-name-small">{trend.name}</span>
                </div>
                <span className="trend-posts">{trend.posts}</span>
                </div>
            </Link>
          ))}

          {trendingTopics.length === 0 && !featuredUser && !featuredPost && (
              <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>No hay tendencias recientes.</p>
          )}
        </div>
      </div>

      <FloatingActionButton 
        onClick={() => setIsModalOpen(true)}
        ariaLabel="Crear publicación"
        icon={<Plus size={24} />}
      />

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </aside>
  );
};

export default TrendsAside;