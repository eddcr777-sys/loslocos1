import React from 'react';
import { Link } from 'react-router-dom';
import VerificationBadge from '../../ui/VerificationBadge';
import { Comment } from '../../../services/api';

interface CommentItemProps {
  comment: Comment;
  user: any;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  handleReplySubmit: (e: React.FormEvent, parentId: string) => void;
  handleDeleteComment: (commentId: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, isReply: boolean, parentId?: string) => void;
  handleInputResize: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  renderComments: (parentId: string | null) => React.ReactNode;
  comments: Comment[];
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  user,
  replyTo,
  setReplyTo,
  replyContent,
  setReplyContent,
  handleReplySubmit,
  handleDeleteComment,
  handleKeyDown,
  handleInputResize,
  renderComments,
  comments
}) => {
  const parentComment = comment.parent_id ? comments.find(c => c.id === comment.parent_id) : null;
  const hasReplies = comments.some(c => c.parent_id === comment.id);

  return (
    <div key={comment.id} id={`comment-${comment.id}`} style={styles.commentContainer}>
      <div style={styles.commentRow}>
          <Link to={`/profile/${comment.user_id}`} style={{ flexShrink: 0 }}>
            <img src={comment.profiles?.avatar_url || 'https://via.placeholder.com/30'} alt="avatar" style={styles.avatar}/>
          </Link>
          <div style={styles.commentBody}>
              <div style={styles.commentBubble}>
                  <Link to={`/profile/${comment.user_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <strong style={styles.author}>
                      {comment.profiles?.full_name || 'Anónimo'}
                      <VerificationBadge type={comment.profiles?.user_type} size={14} />
                    </strong>
                  </Link>
                  <p style={styles.commentText}>
                    {parentComment && (
                      <Link to={`/profile/${parentComment.user_id}`} style={styles.mention}>
                        @{parentComment.profiles?.full_name || 'Anónimo'} 
                        <VerificationBadge type={parentComment.profiles?.user_type} size={12} />
                      </Link>
                    )}
                    {comment.content}
                  </p>
              </div>
              <div style={styles.commentActions}>
                  <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} style={styles.actionButton}>
                      Responder
                  </button>
                  {user && user.id === comment.user_id && (
                    <button onClick={() => handleDeleteComment(comment.id)} style={{ ...styles.actionButton, color: '#dc3545' }}>
                        Eliminar
                    </button>
                  )}
              </div>
          </div>
      </div>

      {replyTo === comment.id && (
          <div style={styles.replyFormContainer}>
             <form onSubmit={(e) => handleReplySubmit(e, comment.id)} style={styles.replyForm}>
                <textarea
                    value={replyContent}
                    onChange={(e) => {
                      setReplyContent(e.target.value);
                      handleInputResize(e);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, true, comment.id)}
                    placeholder="Escribe una respuesta..."
                    style={styles.replyInput}
                    autoFocus
                    rows={1}
                />
                <button type="submit" style={styles.buttonSmall}>Responder</button>
             </form>
          </div>
      )}

      {hasReplies && (
        <div style={styles.repliesContainer}>
          {renderComments(comment.id)}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  commentContainer: {
    marginBottom: '10px',
  },
  commentRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '1px solid #eee'
  },
  commentBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: 'calc(100% - 42px)',
  },
  commentBubble: {
    backgroundColor: '#f0f2f5',
    borderRadius: '16px',
    padding: '8px 12px',
    position: 'relative',
  },
  author: {
    fontSize: '0.85rem',
    color: '#050505',
    display: 'block',
    marginBottom: '2px',
  },
  commentText: {
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    color: '#050505',
  },
  mention: {
    color: '#1d9bf0',
    fontWeight: 600,
    marginRight: '4px',
    textDecoration: 'none',
  },
  commentActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '4px',
    marginLeft: '12px',
    fontSize: '0.75rem',
    color: '#65676b',
  },
  actionButton: {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      fontWeight: 600,
      padding: 0,
      fontSize: 'inherit',
  },
  repliesContainer: {
    paddingLeft: '0px',
    marginLeft: '16px',
    borderLeft: '2px solid #e4e6eb',
    marginTop: '5px',
    paddingTop: '5px',
  },
  replyFormContainer: {
    marginLeft: '42px',
    marginTop: '8px',
    marginBottom: '8px',
    width: 'calc(100% - 42px)',
  },
  replyForm: {
    display: 'flex',
    gap: '0.5rem',
    width: '100%',
  },
  replyInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '0.85rem',
    resize: 'none',
    overflow: 'hidden',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    minHeight: '36px',
  },
  buttonSmall: {
    padding: '4px 12px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
  }
};

export default CommentItem;
