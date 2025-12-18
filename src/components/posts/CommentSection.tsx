import React, { useState, useEffect } from 'react';
import { api, Comment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    const { data } = await api.getComments(postId);
    if (data) setComments(data as any);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data } = await api.addComment(postId, newComment);
    if (data) {
      setComments([...comments, data as any]);
      setNewComment('');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const { data } = await api.addComment(postId, replyContent, parentId);
    if (data) {
      setComments([...comments, data as any]);
      setReplyContent('');
      setReplyTo(null);
    }
  };

  const renderComments = (parentId: string | null = null, depth = 0) => {
    const filteredComments = comments.filter(c => c.parent_id === parentId);
    
    return filteredComments.map(comment => (
      <div key={comment.id} style={{ ...styles.commentItem, marginLeft: `${depth * 20}px` }}>
        <div style={styles.commentContent}>
            <img src={comment.profiles?.avatar_url || 'https://via.placeholder.com/30'} alt="avatar" style={styles.avatar}/>
            <div>
                <strong style={styles.author}>{comment.profiles?.full_name || 'Anonymous'}</strong>
                <p style={{margin: '2px 0'}}>{comment.content}</p>
                <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} style={styles.replyButton}>
                    Reply
                </button>
            </div>
        </div>

        {replyTo === comment.id && (
             <form onSubmit={(e) => handleReplySubmit(e, comment.id)} style={styles.replyForm}>
                <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    style={styles.replyInput}
                    autoFocus
                />
                <button type="submit" style={styles.buttonSmall}>Reply</button>
             </form>
        )}

        {/* Recursive render for replies */}
        {renderComments(comment.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div style={styles.container}>
      {loading ? (
        <p>Loading comments...</p>
      ) : (
        <div style={styles.list}>
          {renderComments(null)}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={!newComment.trim()}>
            Post
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
  list: {
    marginBottom: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  commentItem: {
    marginBottom: '1rem',
    fontSize: '0.9rem',
    borderLeft: '2px solid #f0f0f0',
    paddingLeft: '10px',
  },
  commentContent: {
      display: 'flex',
      gap: '10px'
  },
  avatar: {
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      objectFit: 'cover'
  },
  author: {
    marginRight: '0.5rem',
    fontSize: '0.85rem'
  },
  replyButton: {
      background: 'none',
      border: 'none',
      color: '#007bff',
      cursor: 'pointer',
      fontSize: '0.8rem',
      padding: 0,
      marginTop: '5px'
  },
  form: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  replyForm: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
    marginLeft: '30px'
  },
  input: {
    flex: 1,
    padding: '8px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
  },
  replyInput: {
    flex: 1,
    padding: '6px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '0.85rem',
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
