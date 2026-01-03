import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, MessageSquare, TrendingUp, Star, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import FloatingActionButton from '../ui/FloatingActionButton';
import CreatePostModal from '../../modals/CreatePostModal';
import './TrendsAside.css';

const TrendsAside = () => {
  const [featuredUser, setFeaturedUser] = useState<any>(null);
  const [featuredPost, setFeaturedPost] = useState<any>(null);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrendsData = React.useCallback(async () => {
    try {
      // Usamos 'day' como periodo por defecto para el widget lateral
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - 1);
      const isoDate = startDate.toISOString();

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:profiles!user_id (full_name, username, avatar_url, faculty),
          likes (count),
          comments (count)
        `)
        .gte('created_at', isoDate)
        .limit(500);

      if (error) throw error;

      if (!postsData || postsData.length === 0) {
          setLoading(false);
          return;
      }

      // 1. Usuario Destacado (Más activo)
      const userPostCounts: Record<string, number> = {};
      postsData.forEach(post => {
          const uid = post.user_id;
          userPostCounts[uid] = (userPostCounts[uid] || 0) + 1;
      });
      
      if (Object.keys(userPostCounts).length > 0) {
          const topUserId = Object.keys(userPostCounts).reduce((a, b) => userPostCounts[a] > userPostCounts[b] ? a : b);
          const topUserProfile = postsData.find(p => p.user_id === topUserId)?.profiles;

          if (topUserProfile) {
              setFeaturedUser({
                  id: topUserId,
                  name: (topUserProfile as any).full_name || 'Usuario',
                  handle: (topUserProfile as any).username ? `@${(topUserProfile as any).username}` : '@usuario',
                  faculty: (topUserProfile as any).faculty || 'Comunidad',
                  reason: 'Usuario del día'
              });
          }
      }

      // 2. Post Destacado (Oficiales primero, luego más likes)
      const officialPosts = postsData.filter(p => p.is_official === true);
      let topPost = null;

      const getCount = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          if (Array.isArray(val)) return val.length;
          if (typeof val === 'object' && val.count !== undefined) return val.count;
          return 0;
      };

      if (officialPosts.length > 0) {
          topPost = officialPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          setFeaturedPost({
              id: topPost.id,
              author: (topPost.profiles as any)?.full_name || 'Institucional',
              content: topPost.content,
              likes: getCount(topPost.likes),
              comments: getCount(topPost.comments),
              reason: 'Aviso Universitario'
          });
      } else {
          const sortedByLikes = [...postsData].sort((a, b) => {
              const likesA = getCount(a.likes);
              const likesB = getCount(b.likes);
              return likesB - likesA;
          });

          if (sortedByLikes.length > 0) {
              topPost = sortedByLikes[0];
              setFeaturedPost({
                  id: topPost.id,
                  author: (topPost.profiles as any)?.full_name || 'Usuario',
                  content: topPost.content,
                  likes: getCount(topPost.likes),
                  comments: getCount(topPost.comments),
                  reason: 'Post destacado'
              });
          }
      }

      // 3. Temas (Hashtags)
      const hashtagCounts: Record<string, number> = {};
      postsData.forEach(post => {
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
    // Suscribirse a cambios en posts, likes y comments para refrescar tendencias
    const channels = ['posts', 'likes', 'comments'].map(table => 
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
                <MessageSquare size={16} className="trend-icon" />
                <span className="trend-label">{featuredPost.reason}</span>
                </div>
                <div className="trend-content">
                <span className="trend-name">{featuredPost.author}</span>
                <p className="trend-snippet">"{featuredPost.content?.substring(0, 50)}{featuredPost.content?.length > 50 ? '...' : ''}"</p>
                <span className="trend-meta">{featuredPost.likes} Likes • {featuredPost.comments} Comentarios</span>
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