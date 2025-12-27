import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Star, Bell, X, Hash } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { Post as PostType } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FeaturedCard from './FeaturedCard';
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

  const getTimeframeLabel = React.useCallback(() => {
    switch(timeframe) {
        case 'day': return 'del día';
        case 'week': return 'de la semana';
        case 'month': return 'del mes';
        case 'year': return 'del año';
        default: return '';
    }
  }, [timeframe]);

  const fetchTrendsData = React.useCallback(async () => {
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
          likes (user_id),
          comments (count)
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
  }, [timeframe, getTimeframeLabel]);

  const handleDismiss = (type: 'user' | 'post' | 'topic') => {
    setDismissedAnnouncements(prev => ({ ...prev, [type]: true }));
  };

  useEffect(() => {

    fetchTrendsData();
  }, [fetchTrendsData]);
 // Recargar cuando cambie el periodo

  if (loading) {
    return (
      <div className="trends-page">
      <header className="trends-page-header">
        <h1 style={{ color: 'var(--text-primary)', fontWeight: '800' }}>Explorar Tendencias</h1>
        <div className="timeframe-selector">
          <button className={timeframe === 'day' ? 'active' : ''} onClick={() => setTimeframe('day')}>Día</button>
          <button className={timeframe === 'week' ? 'active' : ''} onClick={() => setTimeframe('week')}>Semana</button>
          <button className={timeframe === 'month' ? 'active' : ''} onClick={() => setTimeframe('month')}>Mes</button>
          <button className={timeframe === 'year' ? 'active' : ''} onClick={() => setTimeframe('year')}>Año</button>
        </div>
      </header>
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando lo más destacado...</div>
    </div>
  );
}

return (
  <div className="trends-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
    <header className="trends-page-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '2.5rem', fontWeight: '800' }}>Explorar Tendencias</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>Descubre lo que está pasando en el campus ahora mismo.</p>
      
      <div className="timeframe-selector" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
          <button className={timeframe === 'day' ? 'active' : ''} onClick={() => setTimeframe('day')}>Día</button>
          <button className={timeframe === 'week' ? 'active' : ''} onClick={() => setTimeframe('week')}>Semana</button>
          <button className={timeframe === 'month' ? 'active' : ''} onClick={() => setTimeframe('month')}>Mes</button>
          <button className={timeframe === 'year' ? 'active' : ''} onClick={() => setTimeframe('year')}>Año</button>
      </div>
    </header>

    <section className="trends-section" style={{ marginBottom: '4rem' }}>
      <h2 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
        <Star className="section-icon" style={{ color: 'var(--warning)' }} /> Destacados {getTimeframeLabel()}
      </h2>
      <div className="featured-grid">
        {/* Tarjeta de Usuario Destacado */}
        {featuredUser && (
          <FeaturedCard type="user" data={featuredUser} />
        )}

        {/* Tarjeta de Publicación Destacada */}
        {featuredPost && (
          <FeaturedCard type="post" data={featuredPost} />
        )}

        {/* Tarjeta de Tema Destacado */}
        {trendingTopics.length > 0 && (
          <Link to={`/search?q=${trendingTopics[0].name.replace('#', '')}`} className="featured-card-link" style={{ textDecoration: 'none' }}>
            <div className="featured-card topic-card" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s ease' }}>
              <div className="card-badge" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: '700' }}>Tema del momento</div>
              <div className="topic-card-content" style={{ textAlign: 'center' }}>
                <Hash size={48} className="topic-card-icon" style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
                <h3 className="topic-card-name" style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-primary)', fontWeight: '800' }}>{trendingTopics[0].name}</h3>
                <span className="topic-card-posts" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{trendingTopics[0].posts}</span>
              </div>
            </div>
          </Link>
        )}

        {!featuredUser && !featuredPost && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                No hay suficiente actividad en este periodo para determinar tendencias.
            </div>
        )}
      </div>
    </section>

    <section className="trends-section" style={{ marginBottom: '4rem' }}>
      <h2 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
        <TrendingUp className="section-icon" style={{ color: 'var(--success)' }} /> Tendencias en la Comunidad
      </h2>
      <div className="topics-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {trendingTopics.length > 0 ? (
          trendingTopics.map((topic, index) => (
            <div key={index} className="topic-item" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <div className="topic-rank" style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: 'var(--border-color)',
                minWidth: '2.5rem',
                textAlign: 'center'
              }}>{index + 1}</div>
              
              <div className="topic-info" style={{ flex: 1 }}>
                <span className="topic-category" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '700' }}>{topic.category}</span>
                <h3 className="topic-name" style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700' }}>{topic.name}</h3>
                <span className="topic-posts" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{topic.posts}</span>
              </div>
              
              <Link to={`/search?q=${topic.name.replace('#', '')}`} style={{ textDecoration: 'none' }}>
                <button className="topic-action" style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>Ver posts</button>
              </Link>
            </div>
          ))
        ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                No hay temas en tendencia para este periodo.
            </div>
        )}
      </div>
    </section>

    <section className="trends-section" style={{ marginBottom: '4rem' }}>
      <h2 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
        <Bell className="section-icon" style={{ color: 'var(--accent-color)' }} /> Anuncios del Periodo
      </h2>
      <div className="trends-announcements" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {featuredUser && !dismissedAnnouncements.user && (
          <div className="announcement-card user-announcement" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '1rem', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
            <div className="announcement-icon" style={{ fontSize: '1.5rem' }}>🏆</div>
            <div className="announcement-content">
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>¡Usuario Más Activo!</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{featuredUser.name} ha liderado la actividad {getTimeframeLabel()}.</p>
            </div>
            <button className="announcement-dismiss" onClick={() => handleDismiss('user')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        )}
        {featuredPost && !dismissedAnnouncements.post && (
          <div className="announcement-card post-announcement" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '1rem', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
            <div className="announcement-icon" style={{ fontSize: '1.5rem' }}>🔥</div>
            <div className="announcement-content">
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>¡Publicación Viral!</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>El post de {(featuredPost as any).profiles?.full_name || 'un usuario'} es el más popular {getTimeframeLabel()}.</p>
            </div>
            <button className="announcement-dismiss" onClick={() => handleDismiss('post')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        )}
        {trendingTopics.length > 0 && !dismissedAnnouncements.topic && (
          <div className="announcement-card topic-announcement" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '1rem', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
            <div className="announcement-icon" style={{ fontSize: '1.5rem' }}>📈</div>
            <div className="announcement-content">
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>¡Tema del Momento!</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{trendingTopics[0].name} está en boca de todos {getTimeframeLabel()}.</p>
            </div>
            <button className="announcement-dismiss" onClick={() => handleDismiss('topic')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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