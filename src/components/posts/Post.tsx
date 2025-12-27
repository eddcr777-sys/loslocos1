import React, { useState } from 'react';
import { api, Post as PostType } from '../../services/api';
import CommentSection from './CommentSection';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PostHeader from './components/PostHeader';
import { usePost } from '../../hooks/usePost';
import ConfirmationModal from '../ui/ConfirmationModal';
import { formatCount } from '../../utils/formatters';
import { Heart, MessageCircle, Share2, Trash2, Megaphone, X } from 'lucide-react';
import './Post.css';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface PostProps {
  post: PostType;
  onPostDeleted?: () => void;
  showCommentsByDefault?: boolean;
  highlightCommentId?: string;
}

const Post: React.FC<PostProps> = ({ 
  post, 
  onPostDeleted, 
  showCommentsByDefault = false,
  highlightCommentId
}) => {
  const { user } = useAuth();
  const {
    likes,
    commentsCount,
    liked,
    showComments,
    setShowComments,
    handleLike,
    handleCommentsUpdate
  } = usePost(post, user, showCommentsByDefault || !!highlightCommentId);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);
    const { error } = await api.deletePost(post.id);
    if (error) {
      console.error('Error al eliminar el post:', error);
      alert('Error al eliminar la publicación: ' + error.message);
    } else {
      if (onPostDeleted) onPostDeleted();
    }
  };

  return (
    <>
      <Card className="post-card">
        <div className="post-padded-content">
          <div className="post-header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <PostHeader 
              userId={post.user_id}
              avatarUrl={post.profiles?.avatar_url || DEFAULT_AVATAR}
              fullName={post.profiles?.full_name}
              userType={post.profiles?.user_type}
              createdAt={post.created_at}
            />
            {user?.id === post.user_id && (
              <Button variant="ghost" size="small" onClick={() => setIsDeleteModalOpen(true)} style={{ padding: '8px', color: '#ef4444' }} title="Eliminar publicación">
                <Trash2 size={18} />
              </Button>
            )}
          </div>

          <p className="post-content-text">
            {post.is_official && (
              <span className="official-post-badge" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                backgroundColor: 'var(--success-soft)', 
                color: 'var(--success)', 
                padding: '0.4rem 0.75rem', 
                borderRadius: 'var(--radius-full)', 
                fontSize: '0.75rem', 
                fontWeight: '800',
                marginBottom: '1rem',
                border: '1px solid var(--success)',
                letterSpacing: '0.05em'
              }}>
                <Megaphone size={14} />
                AVISO OFICIAL
              </span>
            )}
            <br />
            {post.content}
          </p>
        </div>

        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Contenido del post" 
            className="post-image" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            style={{ cursor: 'zoom-in' }}
          />
        )}

        <div className="post-actions" style={{ display: 'flex', padding: '0.5rem', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)' }}>
          <div className="action-item" onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: liked ? 'var(--error)' : 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', padding: '0.75rem', borderRadius: 'var(--radius-md)', flex: 1, justifyContent: 'center', transition: 'all 0.2s ease' }}>
            <Heart size={22} fill={liked ? "var(--error)" : "none"} />
            <span style={{ fontWeight: '600' }}>{formatCount(likes)}</span>
          </div>
          <div className="action-item" onClick={() => setShowComments(!showComments)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', padding: '0.75rem', borderRadius: 'var(--radius-md)', flex: 1, justifyContent: 'center', transition: 'all 0.2s ease' }}>
            <MessageCircle size={22} />
            <span style={{ fontWeight: '600' }}>{formatCount(commentsCount)}</span>
          </div>
        </div>


      {showComments && (
        <CommentSection 
          postId={post.id} 
          postOwnerId={post.user_id} 
          onCommentsChange={handleCommentsUpdate}
          highlightCommentId={highlightCommentId}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
      />
    </Card>

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
            src={post.image_url!} 
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
};

export default Post;
