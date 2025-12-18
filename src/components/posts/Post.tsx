import React from 'react';
import { Post as PostType, api } from '../../services/api';
import CommentSection from './CommentSection';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import './Post.css';

interface PostProps {
  post: PostType;
}

const Post: React.FC<PostProps> = ({ post }) => {
  const { user } = useAuth();
  // Safe access for likes count, handling if it's an array or object based on Supabase join
  const [likes, setLikes] = React.useState(post.likes ? (Array.isArray(post.likes) ? post.likes[0]?.count : post.likes.count) : 0);
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
      alert('Please login to like posts');
      return;
    }
    const { data, error } = await api.toggleLike(post.id, user.id);
    if (!error && data) {
      setLiked(data.liked);
      setLikes((prev: number) => data.liked ? prev + 1 : prev - 1);
    }
  };

  return (
    <Card className="post-card">
      <div className="post-header">
        <div className="post-author-info">
          <Avatar src={post.profiles?.avatar_url} alt={post.profiles?.full_name} size="medium" />
          <div style={{ marginLeft: '10px' }}>
            <span className="post-author-name">{post.profiles?.full_name || 'Anonymous'}</span>
            <span className="post-timestamp">{new Date(post.created_at).toLocaleString()}</span>
          </div>
        </div>
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
          {liked ? '❤️ Liked' : '♡ Like'} ({likes})
        </Button>
        <Button 
            variant="ghost" 
            onClick={() => setShowComments(!showComments)}
            size="small"
        >
          💬 Comments
        </Button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </Card>
  );
};

export default Post;