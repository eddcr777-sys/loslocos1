import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { formatCount } from '../../utils/formatters';

interface FeaturedCardProps {
  type: 'user' | 'post';
  data: any;
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({ type, data }) => {
  const { user } = useAuth();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!data) return null;

  if (type === 'user') {
    return (
      <Link to={`/profile/${data.id}`} className="featured-card-link" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <div className="featured-card user-card" style={{
          padding: '2.5rem 2rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          height: '100%',
          border: '1px solid var(--border-color)',
          transition: 'all 0.2s ease'
        }}>
          <div className="card-badge" style={{
            alignSelf: 'flex-start',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            letterSpacing: '0.025em'
          }}>{data.reason}</div>
          
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Avatar src={data.avatar_url} size="large" />
            <div className="user-info">
              <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: '800' }}>{data.name}</h3>
              <span className="user-handle" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>{data.handle}</span>
            </div>
          </div>
          <p className="user-bio" style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>{data.bio}</p>
          
          <div className="user-stats" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <div className="stat-item" style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{formatCount(data.stats.posts)}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Posts</span></div>
            <div className="stat-item" style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{formatCount(data.stats.followers)}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Seguidores</span></div>
            <div className="stat-item" style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{formatCount(data.stats.following)}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Siguidos</span></div>
          </div>
        </div>
      </Link>
    );
  }

  if (type === 'post') {
    const liked = data.likes?.some((l: any) => l.user_id === user?.id);
    const likesCount = data.likes?.length || 0;
    const commentsCount = data.comments?.[0]?.count || 0;

    return (
      <>
        <div className="featured-card post-card" style={{
          padding: '2rem',
          backgroundColor: 'var(--surface-color)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          height: '100%',
          border: '1px solid var(--border-color)'
        }}>
          <div className="card-badge" style={{
            alignSelf: 'flex-start',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '0.5rem'
        }}>{data.reason || 'Destacado'}</div>
        
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Avatar src={data.profiles?.avatar_url} size="medium" />
          <div className="user-info">
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', fontWeight: '700' }}>{data.profiles?.full_name || 'Usuario'}</h3>
            <span className="user-handle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {new Date(data.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        
        <p className="post-content-snippet" style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.7', fontSize: '1.05rem' }}>
          {data.content}
        </p>
        
        {data.image_url && (
          <img 
            src={data.image_url} 
            alt="Contenido del post" 
            className="post-image-preview" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-lg)', objectFit: 'cover', maxHeight: '500px', boxShadow: 'var(--shadow-md)', cursor: 'zoom-in', border: '1px solid var(--border-color)' }}
          />
        )}
        
        <div className="post-actions" style={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          alignItems: 'center',
          marginTop: 'auto', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid var(--border-color)' 
        }}>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '1rem', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-md)', transition: 'all 0.2s ease' }}>
            <Heart 
              size={22} 
              fill={liked ? "var(--error)" : "none"} 
              color={liked ? "var(--error)" : "currentColor"}
            /> 
            <span style={{ fontWeight: '600' }}>{formatCount(likesCount)}</span>
          </div>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '1rem', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-md)', transition: 'all 0.2s ease' }}>
            <MessageCircle size={22} /> 
            <span style={{ fontWeight: '600' }}>{formatCount(commentsCount)}</span>
          </div>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-md)', transition: 'all 0.2s ease' }}>
            <Share2 size={22} />
          </div>
        </div>
        </div>


        {isLightboxOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 99999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'zoom-out',
              padding: '1rem'
            }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                padding: '8px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>
            <img 
              src={data.image_url} 
              alt="Vista completa" 
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  return null;
};

export default FeaturedCard;