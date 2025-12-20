import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

interface FeaturedCardProps {
  type: 'user' | 'post';
  data: any;
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({ type, data }) => {
  const { user } = useAuth();

  if (!data) return null;

  if (type === 'user') {
    return (
      <Link to={`/profile/${data.id}`} className="featured-card-link" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <div className="featured-card user-card" style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          height: '100%',
          border: '1px solid #f1f5f9'
        }}>
          <div className="card-badge" style={{
            alignSelf: 'flex-start',
            padding: '0.5rem 1rem',
            backgroundColor: '#f0f9ff',
            color: '#0284c7',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '600',
            letterSpacing: '0.025em'
          }}>{data.reason}</div>
          
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Avatar src={data.avatar_url} size="large" />
            <div className="user-info">
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>{data.name}</h3>
              <span className="user-handle" style={{ color: '#64748b', fontSize: '1rem' }}>{data.handle}</span>
            </div>
          </div>
          <p className="user-bio" style={{ margin: 0, color: '#334155', lineHeight: '1.6', fontSize: '1.05rem' }}>{data.bio}</p>
          
          <div className="user-stats" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <div className="stat-item" style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.25rem', color: '#0f172a' }}>{data.stats.posts}</strong> <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Posts</span></div>
            <div className="stat-item" style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.25rem', color: '#0f172a' }}>{data.stats.followers}</strong> <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Seguidores</span></div>
            <div className="stat-item" style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: '1.25rem', color: '#0f172a' }}>{data.stats.following}</strong> <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Seguidos</span></div>
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
      <div className="featured-card post-card" style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        height: '100%',
        border: '1px solid #f1f5f9'
      }}>
        <div className="card-badge" style={{
            alignSelf: 'flex-start',
            padding: '0.5rem 1rem',
            backgroundColor: '#fdf2f8',
            color: '#db2777',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
        }}>{data.reason || 'Destacado'}</div>
        
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Avatar src={data.profiles?.avatar_url} size="medium" />
          <div className="user-info">
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#0f172a', fontWeight: '600' }}>{data.profiles?.full_name || 'Usuario'}</h3>
            <span className="user-handle" style={{ fontSize: '0.9rem', color: '#64748b' }}>
              {new Date(data.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        
        <p className="post-content-snippet" style={{ margin: 0, color: '#1e293b', lineHeight: '1.7', fontSize: '1.1rem' }}>
          {data.content}
        </p>
        
        {data.image_url && (
          <img 
            src={data.image_url} 
            alt="Contenido del post" 
            className="post-image-preview" 
            style={{ width: '100%', borderRadius: '16px', objectFit: 'cover', maxHeight: '500px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
        )}
        
        <div className="post-actions" style={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          alignItems: 'center',
          marginTop: 'auto', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid #e2e8f0' 
        }}>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '1rem', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
            <Heart 
              size={24} 
              fill={liked ? "currentColor" : "none"} 
              color={liked ? "#ef4444" : "currentColor"}
            /> 
            <span style={{ fontWeight: '500' }}>{likesCount}</span>
          </div>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '1rem', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
            <MessageCircle size={24} /> 
            <span style={{ fontWeight: '500' }}>{commentsCount}</span>
          </div>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
            <Share2 size={24} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FeaturedCard;