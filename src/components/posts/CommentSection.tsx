import React, { useState, useEffect, useRef } from 'react';
import { api, Comment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CommentItem from './comments/CommentItem';
import CommentForm from './comments/CommentForm';

interface CommentSectionProps {
  postId: string;
  postOwnerId?: string;
  onCommentsChange?: (count: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, postOwnerId, onCommentsChange }) => {
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

  useEffect(() => {
    if (!loading && onCommentsChange) {
      onCommentsChange(comments.length);
    }
  }, [comments, loading, onCommentsChange]);

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

      // Notificar al dueño del post
      if (postOwnerId && user && postOwnerId !== user.id) {
        await api.createNotification({
          user_id: postOwnerId,
          actor_id: user.id,
          type: 'comment',
          entity_id: data.id
        });
      }
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

      // Notificar al dueño del post
      if (postOwnerId && user && postOwnerId !== user.id) {
        await api.createNotification({
          user_id: postOwnerId,
          actor_id: user.id,
          type: 'comment',
          entity_id: data.id
        });
      }

      // Notificar al dueño del comentario original si es distinto al dueño del post
      const parentComment = comments.find(c => c.id === parentId);
      if (parentComment && user && parentComment.user_id !== user.id && parentComment.user_id !== postOwnerId) {
        await api.createNotification({
          user_id: parentComment.user_id,
          actor_id: user.id,
          type: 'comment',
          entity_id: data.id
        });
      }
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

    return filteredComments.map(comment => (
      <CommentItem 
        key={comment.id}
        comment={comment}
        user={user}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        replyContent={replyContent}
        setReplyContent={setReplyContent}
        handleReplySubmit={handleReplySubmit}
        handleDeleteComment={handleDeleteComment}
        handleKeyDown={handleKeyDown}
        handleInputResize={handleInputResize}
        renderComments={renderComments}
        comments={comments}
      />
    ));
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
        <CommentForm 
          ref={mainInputRef}
          newComment={newComment}
          setNewComment={setNewComment}
          handleSubmit={handleSubmit}
          handleKeyDown={handleKeyDown}
        />
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
};

export default CommentSection;
