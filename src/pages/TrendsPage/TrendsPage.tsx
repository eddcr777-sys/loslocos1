import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, Star, Heart, Share2, Bell, X, Hash } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Post from '../../components/posts/Post';
import { supabase } from '../../utils/supabaseClient';
import { Post as PostType } from '../../services/api';
import './TrendsPage.css';

const TrendsPage = () => {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [featuredUser, setFeaturedUser] = useState<any>(null);
  const [featuredPost, setFeaturedPost] = useState<PostType | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState({
    user: false,
    post: false,
    topic: false,
  });

  const fetchTrendsData = async () => {
    try {
      setLoading(true);

      // Calcular fecha de inicio según el periodo seleccionado
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case 'day': startDate.setDate(now.getDate() - 1); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      const isoDate = startDate.toISOString();

      // 1. Obtener posts del periodo para analizar (aumentamos a 500 para mayor exactitud)
      // Traemos también los likes para calcular el post más popular
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (*),
          likes (user_id)
        `)
        .gte('created_at', isoDate)
        .limit(500);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setFeaturedUser(null);
        setFeaturedPost(null);
        setTrendingTopics([]);
        setLoading(false);
        return;
      }

      // --- LÓGICA PARA ENCONTRAR AL USUARIO DESTACADO (Más activo) ---
      const userPostCounts: Record<string, number> = {};
      postsData.forEach(post => {
        const uid = post.user_id;
        userPostCounts[uid] = (userPostCounts[uid] || 0) + 1;
      });

      // Encontrar el ID con más posts
      const topUserId = Object.keys(userPostCounts).reduce((a, b) => userPostCounts[a] > userPostCounts[b] ? a : b);
      const topUserProfile = postsData.find(p => p.user_id === topUserId)?.profiles;

      if (topUserProfile) {
        // Obtener estadísticas adicionales del usuario ganador
        const [postsRes, followersRes, followingRes] = await Promise.all([
          supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', topUserId),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', topUserId),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', topUserId)
        ]);

        setFeaturedUser({
          id: topUserProfile.id,
          name: topUserProfile.full_name || 'Usuario',
          handle: topUserProfile.username ? `@${topUserProfile.username}` : '@usuario',
          avatar_url: topUserProfile.avatar_url,
          faculty: topUserProfile.faculty || 'Comunidad',
          reason: `Más activo ${getTimeframeLabel()}`,
          bio: topUserProfile.bio || 'Sin biografía disponible.',
          stats: { 
            followers: followersRes.count || 0, 
            posts: postsRes.count || 0, 
            following: followingRes.count || 0 
          }
        });
      }

      // --- LÓGICA PARA ENCONTRAR EL POST DESTACADO (Más likes) ---
      // Ordenamos los posts recuperados por cantidad de likes
      const sortedByLikes = [...postsData].sort((a, b) => {
        const likesA = a.likes ? a.likes.length : 0;
        const likesB = b.likes ? b.likes.length : 0;
        return likesB - likesA;
      });

      // El primero es el más popular
      if (sortedByLikes.length > 0) {
        setFeaturedPost({
            ...sortedByLikes[0],
            reason: `Post top ${getTimeframeLabel()}`
        } as any);
      }

      // --- LÓGICA PARA TEMAS (Hashtags más usados) ---
      const hashtagCounts: Record<string, number> = {};
      postsData.forEach(post => {
        // Buscar palabras que empiecen con #
        const tags = post.content?.match(/#[a-zA-Z0-9_ñáéíóú]+/g);
        if (tags) {
            tags.forEach((tag: string) => {
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
            });
        }
      });

      // Convertir a array y ordenar
      const sortedTopics = Object.entries(hashtagCounts)
        .map(([name, count]) => ({ name, posts: `${count} posts`, category: 'Tendencia' }))
        .sort((a, b) => parseInt(b.posts) - parseInt(a.posts))
        .slice(0, 5); // Top 5

      setTrendingTopics(sortedTopics);

    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeframeLabel = () => {
    switch(timeframe) {
        case 'day': return 'del día';
        case 'week': return 'de la semana';
        case 'month': return 'del mes';
        case 'year': return 'del año';
        default: return '';
    }
  };

  const handleDismiss = (type: 'user' | 'post' | 'topic') => {
    setDismissedAnnouncements(prev => ({ ...prev, [type]: true }));
  };

  useEffect(() => {
    fetchTrendsData();
  }, [timeframe]); // Recargar cuando cambie el periodo

  if (loading) {
    return (
      <div className="trends-page">
        <header className="trends-page-header">
          <h1>Explorar Tendencias</h1>
          <div className="timeframe-selector">
            <button className={timeframe === 'day' ? 'active' : ''} onClick={() => setTimeframe('day')}>Día</button>
            <button className={timeframe === 'week' ? 'active' : ''} onClick={() => setTimeframe('week')}>Semana</button>
            <button className={timeframe === 'month' ? 'active' : ''} onClick={() => setTimeframe('month')}>Mes</button>
            <button className={timeframe === 'year' ? 'active' : ''} onClick={() => setTimeframe('year')}>Año</button>
          </div>
        </header>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando lo más destacado...</div>
      </div>
    );
  }

  return (
    <div className="trends-page">
      <header className="trends-page-header">
        <h1>Explorar Tendencias</h1>
        <p>Descubre lo que está pasando en el campus ahora mismo.</p>
        
        <div className="timeframe-selector">
            <button className={timeframe === 'day' ? 'active' : ''} onClick={() => setTimeframe('day')}>Día</button>
            <button className={timeframe === 'week' ? 'active' : ''} onClick={() => setTimeframe('week')}>Semana</button>
            <button className={timeframe === 'month' ? 'active' : ''} onClick={() => setTimeframe('month')}>Mes</button>
            <button className={timeframe === 'year' ? 'active' : ''} onClick={() => setTimeframe('year')}>Año</button>
        </div>
      </header>

      <section className="trends-section">
        <h2 className="section-title">
          <Star className="section-icon" /> Destacados {getTimeframeLabel()}
        </h2>
        <div className="featured-grid">
          {/* Tarjeta de Usuario Destacado */}
          {featuredUser && (
            <Link to={`/profile/${featuredUser.id}`} className="featured-card-link">
              <div className="featured-card user-card">
                <div className="card-badge">{featuredUser.reason}</div>
                <div className="user-profile">
                  <Avatar src={featuredUser.avatar_url} size="large" />
                  <div className="user-info">
                    <h3>{featuredUser.name}</h3>
                    <span className="user-handle">{featuredUser.handle}</span>
                  </div>
                </div>
                <p className="user-bio">{featuredUser.bio}</p>
                <div className="user-stats">
                  <div className="stat-item"><strong>{featuredUser.stats.posts}</strong> <span>Posts</span></div>
                  <div className="stat-item"><strong>{featuredUser.stats.followers}</strong> <span>Seguidores</span></div>
                  <div className="stat-item"><strong>{featuredUser.stats.following}</strong> <span>Seguidos</span></div>
                </div>
              </div>
            </Link>
          )}

          {/* Tarjeta de Publicación Destacada */}
          {featuredPost && (
            <div className="featured-card post-card">
              <div className="card-badge">{(featuredPost as any).reason || 'Destacado'}</div>
              <div className="post-header">
                <Avatar src={(featuredPost.profiles as any)?.avatar_url} size="medium" />
                <div className="post-meta">
                  <span className="post-author">{(featuredPost.profiles as any)?.full_name || 'Usuario'}</span>
                  <span className="post-time">· {new Date(featuredPost.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="post-content-snippet">{featuredPost.content}</p>
              {featuredPost.image_url && (
                <img src={featuredPost.image_url} alt="Contenido del post" className="post-image-preview" />
              )}
              <div className="post-actions">
                <div className="action-item">
                  <Heart size={18} /> {(featuredPost.likes as any)?.length || 0}
                </div>
                <div className="action-item">
                  <MessageSquare size={18} /> 0
                </div>
                <div className="action-item">
                  <Share2 size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Tarjeta de Tema Destacado */}
          {trendingTopics.length > 0 && (
            <Link to={`/search?q=${trendingTopics[0].name.replace('#', '')}`} className="featured-card-link">
              <div className="featured-card topic-card">
                <div className="card-badge">Tema del momento</div>
                <div className="topic-card-content">
                  <Hash size={32} className="topic-card-icon" />
                  <h3 className="topic-card-name">{trendingTopics[0].name}</h3>
                  <span className="topic-card-posts">{trendingTopics[0].posts}</span>
                </div>
              </div>
            </Link>
          )}

          {!featuredUser && !featuredPost && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No hay suficiente actividad en este periodo para determinar tendencias.
              </div>
          )}
        </div>
      </section>

      <section className="trends-section">
        <h2 className="section-title">
          <TrendingUp className="section-icon" /> Tendencias en la Comunidad
        </h2>
        <div className="topics-list">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic, index) => (
              <div key={index} className="topic-item">
                <div className="topic-rank">{index + 1}</div>
                <div className="topic-info">
                  <span className="topic-category">{topic.category}</span>
                  <h3 className="topic-name">{topic.name}</h3>
                  <span className="topic-posts">{topic.posts}</span>
                </div>
                <button className="topic-action">Ver posts</button>
              </div>
            ))
          ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                  No hay temas en tendencia para este periodo.
              </div>
          )}
        </div>
      </section>

      <section className="trends-section">
        <h2 className="section-title">
          <Bell className="section-icon" /> Anuncios del Periodo
        </h2>
        <div className="trends-announcements">
          {featuredUser && !dismissedAnnouncements.user && (
            <div className="announcement-card user-announcement">
              <div className="announcement-icon">🏆</div>
              <div className="announcement-content">
                <strong>¡Usuario Más Activo!</strong>
                <p>{featuredUser.name} ha liderado la actividad {getTimeframeLabel()}.</p>
              </div>
              <button className="announcement-dismiss" onClick={() => handleDismiss('user')} aria-label="Cerrar anuncio">
                <X size={18} />
              </button>
            </div>
          )}
          {featuredPost && !dismissedAnnouncements.post && (
            <div className="announcement-card post-announcement">
              <div className="announcement-icon">🔥</div>
              <div className="announcement-content">
                <strong>¡Publicación Viral!</strong>
                <p>El post de {(featuredPost as any).profiles?.full_name || 'un usuario'} es el más popular {getTimeframeLabel()}.</p>
              </div>
              <button className="announcement-dismiss" onClick={() => handleDismiss('post')} aria-label="Cerrar anuncio">
                <X size={18} />
              </button>
            </div>
          )}
          {trendingTopics.length > 0 && !dismissedAnnouncements.topic && (
            <div className="announcement-card topic-announcement">
              <div className="announcement-icon">📈</div>
              <div className="announcement-content">
                <strong>¡Tema del Momento!</strong>
                <p>{trendingTopics[0].name} está en boca de todos {getTimeframeLabel()}.</p>
              </div>
              <button className="announcement-dismiss" onClick={() => handleDismiss('topic')} aria-label="Cerrar anuncio">
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TrendsPage;