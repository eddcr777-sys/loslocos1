import React from 'react';
import { api, Post as PostType } from '../../services/api';
import CommentSection from './CommentSection';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PostHeader from './components/PostHeader';
import PostContent from './components/PostContent';
import PostActions from './components/PostActions';
import { usePost } from '../../hooks/usePost';
import ConfirmationModal from '../ui/ConfirmationModal';
import { Trash2 } from 'lucide-react';
import './Post.css';

interface PostProps {
  post: PostType;
  onPostDeleted?: () => void;
}

const Post: React.FC<PostProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const {
    likes,
    commentsCount,
    liked,
    showComments,
    setShowComments,
    handleLike,
    handleCommentsUpdate
  } = usePost(post, user);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

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
    <Card className="post-card">
      <div className="post-padded-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PostHeader 
          userId={post.user_id}
          avatarUrl={post.profiles?.avatar_url}
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

      <PostContent 
        content={post.content}
        imageUrl={post.image_url}
      />

      <PostActions 
        liked={liked}
        likes={likes}
        commentsCount={commentsCount}
        onLike={handleLike}
        onToggleComments={() => setShowComments(!showComments)}
        showComments={showComments}
      />

      {showComments && (
        <div className="post-padded-content">
          <CommentSection 
            postId={post.id} 
            postOwnerId={post.user_id} 
            onCommentsChange={handleCommentsUpdate} 
          />
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
      />
    </Card>
  );
};

export default Post;
