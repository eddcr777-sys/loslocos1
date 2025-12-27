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
            <div className="stat-item"><strong>{formatCount(data.stats.posts)}</strong> <span>Posts</span></div>
            <div className="stat-item"><strong>{formatCount(data.stats.followers)}</strong> <span>Seguidores</span></div>
            <div className="stat-item"><strong>{formatCount(data.stats.following)}</strong> <span>Seguidos</span></div>
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
        <div className="featured-card post-card">
          <div className="card-badge">{data.reason || 'Destacado'}</div>
        
          <div className="user-profile">
            <Avatar src={data.profiles?.avatar_url} size="medium" />
            <div className="user-info">
              <h3 style={{ fontSize: '1.1rem' }}>{data.profiles?.full_name || 'Usuario'}</h3>
              <span className="user-handle">
                {new Date(data.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
          
          <p className="post-content-snippet">
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
            />
          )}
          
          <div className="post-actions">
            <div className="action-item">
              <Heart 
                size={22} 
                fill={liked ? "var(--error)" : "none"} 
                color={liked ? "var(--error)" : "currentColor"}
              /> 
              <span style={{ fontWeight: '600' }}>{formatCount(likesCount)}</span>
            </div>
            <div className="action-item">
              <MessageCircle size={22} /> 
              <span style={{ fontWeight: '600' }}>{formatCount(commentsCount)}</span>
            </div>
            <div className="action-item">
              <Share2 size={22} />
            </div>
          </div>
        </div>

        {isLightboxOpen && (
          <div 
            className="lightbox-overlay"
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 99999,
              display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out', padding: '1rem'
            }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '50%', padding: '8px',
                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>
            <img 
              src={data.image_url} 
              alt="Vista completa" 
              style={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px',
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