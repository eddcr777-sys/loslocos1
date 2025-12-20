import React from 'react';
import Button from '../../ui/Button';

interface PostActionsProps {
  liked: boolean;
  likes: number;
  commentsCount: number;
  onLike: () => void;
  onToggleComments: () => void;
  showComments: boolean;
}

const PostActions: React.FC<PostActionsProps> = ({ 
  liked, 
  likes, 
  commentsCount, 
  onLike, 
  onToggleComments,
  showComments 
}) => {
  return (
    <div className="post-padded-content">
      <div className="post-actions">
        <Button 
            variant={liked ? 'primary' : 'ghost'} 
            onClick={onLike}
            size="small"
        >
          {liked ? '❤️ Me gusta' : '♡ Me gusta'} ({likes})
        </Button>
        <Button 
            variant="ghost" 
            onClick={onToggleComments}
            size="small"
        >
          💬 Comentarios ({commentsCount})
        </Button>
      </div>
    </div>
  );
};

export default PostActions;