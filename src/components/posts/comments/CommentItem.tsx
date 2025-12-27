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
    marginBottom: '1rem',
    padding: '4px 0',
  },
  commentRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  avatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '2px solid var(--surface-color)',
      boxShadow: 'var(--shadow-sm)'
  },
  commentBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: 'calc(100% - 48px)',
  },
  commentBubble: {
    backgroundColor: 'var(--bg-color)', 
    borderRadius: 'var(--radius-lg)',
    padding: '0.85rem 1.15rem',
    position: 'relative',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-xs)'
  },
  author: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: '2px',
    fontWeight: 700
  },
  commentText: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    color: 'var(--text-secondary)',
  },
  mention: {
    color: 'var(--accent-color)',
    fontWeight: 700,
    marginRight: '6px',
    textDecoration: 'none',
  },
  commentActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '6px',
    marginLeft: '12px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  actionButton: {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      fontWeight: 700,
      padding: 0,
      fontSize: 'inherit',
      transition: 'color 0.2s ease'
  },
  repliesContainer: {
    paddingLeft: '0px',
    marginLeft: '18px',
    borderLeft: '2px solid var(--border-color)',
    marginTop: '8px',
    paddingTop: '4px',
  },
  replyFormContainer: {
    marginLeft: '48px',
    marginTop: '10px',
    marginBottom: '10px',
    width: 'calc(100% - 48px)',
  },
  replyForm: {
    display: 'flex',
    gap: '0.5rem',
    width: '100%',
  },
  replyInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-color)',
    fontSize: '0.85rem',
    resize: 'none',
    overflow: 'hidden',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    minHeight: '38px',
    backgroundColor: 'var(--surface-color)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  buttonSmall: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    backgroundColor: 'var(--text-primary)',
    color: 'var(--bg-color)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 700
  }
};


export default CommentItem;
