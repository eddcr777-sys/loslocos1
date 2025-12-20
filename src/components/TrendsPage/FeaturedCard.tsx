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
      <Link to={`/profile/${data.id}`} className="featured-card-link">
        <div className="featured-card user-card">
          <div className="card-badge">{data.reason}</div>
          <div className="user-profile">
            <Avatar src={data.avatar_url} size="large" />
            <div className="user-info">
              <h3>{data.name}</h3>
              <span className="user-handle">{data.handle}</span>
            </div>
          </div>
          <p className="user-bio">{data.bio}</p>
          <div className="user-stats">
            <div className="stat-item"><strong>{data.stats.posts}</strong> <span>Posts</span></div>
            <div className="stat-item"><strong>{data.stats.followers}</strong> <span>Seguidores</span></div>
            <div className="stat-item"><strong>{data.stats.following}</strong> <span>Seguidos</span></div>
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
      <div className="featured-card post-card">
        <div className="card-badge">{data.reason || 'Destacado'}</div>
        <div className="user-profile" style={{ marginBottom: '12px' }}>
          <Avatar src={data.profiles?.avatar_url} size="medium" />
          <div className="user-info">
            <h3 style={{ fontSize: '1rem', margin: 0 }}>{data.profiles?.full_name || 'Usuario'}</h3>
            <span className="user-handle" style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>
              {new Date(data.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <p className="post-content-snippet" style={{ marginBottom: '12px', color: '#334155', lineHeight: '1.5' }}>
          {data.content}
        </p>
        {data.image_url && (
          <img 
            src={data.image_url} 
            alt="Contenido del post" 
            className="post-image-preview" 
            style={{ width: '100%', borderRadius: '8px', marginBottom: '12px', objectFit: 'cover', maxHeight: '300px' }}
          />
        )}
        <div className="post-actions" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          placeItems: 'center',
          marginTop: 'auto', 
          paddingTop: '12px', 
          borderTop: '1px solid #e2e8f0' 
        }}>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer' }}>
            <Heart 
              size={20} 
              fill={liked ? "currentColor" : "none"} 
              color={liked ? "#ef4444" : "currentColor"}
            /> 
            <span>{likesCount}</span>
          </div>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer' }}>
            <MessageCircle size={20} /> 
            <span>{commentsCount}</span>
          </div>
          <div className="action-item" style={{ display: 'flex', alignItems: 'center', color: '#64748b', cursor: 'pointer' }}>
            <Share2 size={20} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FeaturedCard;