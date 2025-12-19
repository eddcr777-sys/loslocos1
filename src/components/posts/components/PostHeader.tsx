import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../ui/Avatar';
import VerificationBadge from '../../ui/VerificationBadge';
import { timeAgo } from '../../../utils/dateUtils';

interface PostHeaderProps {
  userId: string;
  avatarUrl?: string;
  fullName?: string;
  userType?: string;
  createdAt: string;
}

const PostHeader: React.FC<PostHeaderProps> = ({ userId, avatarUrl, fullName, userType, createdAt }) => {
  return (
    <div className="post-header">
      <Link to={`/profile/${userId}`} className="post-author-info" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
        <Avatar src={avatarUrl} alt={fullName} size="medium" />
        <div style={{ marginLeft: '10px' }}>
          <span className="post-author-name">
            {fullName || 'Anónimo'}
            <VerificationBadge type={userType as 'common' | 'popular' | 'admin'} />
          </span>
          <span className="post-timestamp">{timeAgo(createdAt)}</span>
        </div>
      </Link>
    </div>
  );
};

export default PostHeader;
