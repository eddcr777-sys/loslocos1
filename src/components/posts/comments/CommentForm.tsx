import React, { forwardRef } from 'react';

interface CommentFormProps {
  newComment: string;
  setNewComment: (content: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, isReply: boolean) => void;
}

const CommentForm = forwardRef<HTMLTextAreaElement, CommentFormProps>(({
  newComment,
  setNewComment,
  handleSubmit,
  handleKeyDown
}, ref) => {
  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <textarea
        ref={ref}
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
  );
});

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
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
  button: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

export default CommentForm;
