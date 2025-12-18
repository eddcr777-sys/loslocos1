import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api, Comment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CommentSectionProps {
  postId: string;
  onCommentsChange?: (count: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, onCommentsChange }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  // Notificar al componente padre (Post) cuando cambie el número de comentarios
  useEffect(() => {
    if (!loading && onCommentsChange) {
      onCommentsChange(comments.length);
    }
  }, [comments, loading, onCommentsChange]);

  // Ajustar altura del textarea principal automáticamente
  useEffect(() => {
    if (mainInputRef.current) {
      mainInputRef.current.style.height = 'auto';
      if (newComment) {
        mainInputRef.current.style.height = `${mainInputRef.current.scrollHeight}px`;
      }
    }
  }, [newComment]);

  const loadComments = async () => {
    const { data } = await api.getComments(postId);
    if (data) setComments(data as any);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data, error } = await api.addComment(postId, newComment);
    
    if (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar comentario: ' + (error as any).message);
    }
    if (data) {
      setComments([...comments, data as any]);
      setNewComment('');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const { data, error } = await api.addComment(postId, replyContent, parentId);
    
    if (error) {
      console.error('Error adding reply:', error);
      alert('Error al agregar respuesta: ' + (error as any).message);
    }
    if (data) {
      setComments([...comments, data as any]);
      setReplyContent('');
      setReplyTo(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    const { error } = await api.deleteComment(commentId);
    
    if (error) {
      console.error('Error deleting comment:', error);
      alert('Error al eliminar el comentario: ' + error.message);
    } else {
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, isReply: boolean, parentId?: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isReply && parentId) {
        handleReplySubmit({ preventDefault: () => {} } as React.FormEvent, parentId);
      } else {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }
    }
  };

  const renderComments = (parentId: string | null = null) => {
    const filteredComments = comments.filter(c => c.parent_id === parentId);
    
    if (filteredComments.length === 0) return null;

    return filteredComments.map(comment => {
      const parentComment = comment.parent_id ? comments.find(c => c.id === comment.parent_id) : null;
      const hasReplies = comments.some(c => c.parent_id === comment.id);

      return (
        <div key={comment.id} style={styles.commentContainer}>
          <div style={styles.commentRow}>
              <Link to={`/profile/${comment.user_id}`} style={{ flexShrink: 0 }}>
                <img src={comment.profiles?.avatar_url || 'https://via.placeholder.com/30'} alt="avatar" style={styles.avatar}/>
              </Link>
              <div style={styles.commentBody}>
                  <div style={styles.commentBubble}>
                      <Link to={`/profile/${comment.user_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <strong style={styles.author}>{comment.profiles?.full_name || 'Anónimo'}</strong>
                      </Link>
                      <p style={styles.commentText}>
                        {parentComment && (
                          <Link to={`/profile/${parentComment.user_id}`} style={styles.mention}>
                            @{parentComment.profiles?.full_name || 'Anónimo'}
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

          {/* Recursive render for replies */}
          {hasReplies && (
            <div style={styles.repliesContainer}>
              {renderComments(comment.id)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={styles.container}>
      {loading ? (
        <p>Cargando comentarios...</p>
      ) : (
        <>
          <h4 style={styles.header}>Comentarios ({comments.length})</h4>
          <div style={styles.list}>{renderComments(null)}</div>
        </>
      )}

      {user && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <textarea
            ref={mainInputRef}
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, false)}
            style={styles.input}
            rows={1}
          />
          <button type="submit" style={styles.button} disabled={!newComment.trim()}>
            Publicar
          </button>
        </form>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: '1rem',
    borderTop: '1px solid #eee',
    paddingTop: '1rem',
  },
  header: {
    margin: '0 0 10px 0',
    fontSize: '1rem',
    color: '#65676b',
  },
  list: {
    marginBottom: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '5px',
  },
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
    marginLeft: '16px', // Alineado al centro del avatar
    borderLeft: '2px solid #e4e6eb', // Línea de hilo
    marginTop: '5px',
    paddingTop: '5px',
  },
  form: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
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
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
    resize: 'none',
    overflow: 'hidden',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    minHeight: '42px',
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
  button: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
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

export default CommentSection;
