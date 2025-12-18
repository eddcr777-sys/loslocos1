import React from 'react';
import { Link } from 'react-router-dom';
import { Post as PostType, api } from '../../services/api';
import CommentSection from './CommentSection';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import './Post.css';
import { timeAgo } from '../../utils/dateUtils';

interface PostProps {
  post: PostType;
}

const Post: React.FC<PostProps> = ({ post }) => {
  const { user } = useAuth();
  // Safe access for likes count, handling if it's an array or object based on Supabase join
  const [likes, setLikes] = React.useState(post.likes ? (Array.isArray(post.likes) ? post.likes[0]?.count : post.likes.count) : 0);
  // Inicializamos el contador de comentarios igual que los likes
  const [commentsCount, setCommentsCount] = React.useState(post.comments ? (Array.isArray(post.comments) ? post.comments[0]?.count : post.comments.count) : 0);
  const [liked, setLiked] = React.useState(false); 
  const [showComments, setShowComments] = React.useState(false);

  React.useEffect(() => {
    // Ideally we might want to check this in the parent or batch it, 
    // but for now checking per post is acceptable for MVP
    if (user) {
        checkLiked();
    }
  }, [user, post.id]);

  const checkLiked = async () => {
    if(!user) return;
    const { liked } = await api.checkUserLiked(post.id, user.id);
    setLiked(liked);
  }

  const handleLike = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para dar me gusta');
      return;
    }
    const { data, error } = await api.toggleLike(post.id, user.id);
    if (!error && data) {
      setLiked(data.liked);
      setLikes((prev: number) => data.liked ? prev + 1 : prev - 1);
    }
  };

  // Esta función se pasará a CommentSection para que nos avise cuando cambie el número
  const handleCommentsUpdate = React.useCallback((count: number) => {
    setCommentsCount(count);
  }, []);

  return (
    <Card className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.user_id}`} className="post-author-info" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <Avatar src={post.profiles?.avatar_url} alt={post.profiles?.full_name} size="medium" />
          <div style={{ marginLeft: '10px' }}>
            <span className="post-author-name">{post.profiles?.full_name || 'Anónimo'}</span>
            <span className="post-timestamp">{timeAgo(post.created_at)}</span>
          </div>
        </Link>
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.image_url && (
            <img src={post.image_url} alt="Post content" className="post-image" />
        )}
      </div>

      <div className="post-actions">
        <Button 
            variant={liked ? 'primary' : 'ghost'} 
            onClick={handleLike}
            size="small"
        >
          {liked ? '❤️ Me gusta' : '♡ Me gusta'} ({likes})
        </Button>
        <Button 
            variant="ghost" 
            onClick={() => setShowComments(!showComments)}
            size="small"
        >
          💬 Comentarios ({commentsCount})
        </Button>
      </div>

      {showComments && <CommentSection postId={post.id} onCommentsChange={handleCommentsUpdate} />}
    </Card>
  );
};

export default Post;