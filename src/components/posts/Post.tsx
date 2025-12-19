import React from 'react';
import { Post as PostType } from '../../services/api';
import CommentSection from './CommentSection';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';
import PostHeader from './components/PostHeader';
import PostContent from './components/PostContent';
import PostActions from './components/PostActions';
import { usePost } from '../../hooks/usePost';
import './Post.css';

interface PostProps {
  post: PostType;
}

const Post: React.FC<PostProps> = ({ post }) => {
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

  return (
    <Card className="post-card">
      <div className="post-padded-content">
        <PostHeader 
          userId={post.user_id}
          avatarUrl={post.profiles?.avatar_url}
          fullName={post.profiles?.full_name}
          userType={post.profiles?.user_type}
          createdAt={post.created_at}
        />
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
    </Card>
  );
};

export default Post;
