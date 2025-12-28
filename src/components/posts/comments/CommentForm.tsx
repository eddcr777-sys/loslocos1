import React, { forwardRef } from 'react';
import { useMentions } from '../../../hooks/useMentions';
import MentionSuggestions from '../MentionSuggestions';

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
  const {
    showMentions,
    suggestions,
    loadingMentions,
    mentionQuery,
    handleInput,
    applyMention
  } = useMentions();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    handleInput(value, e.target.selectionStart || 0);
  };

  const handleSelectMention = (username: string) => {
    const newText = applyMention(newComment, username, mentionQuery);
    setNewComment(newText);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {showMentions && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, width: '100%', zIndex: 1001 }}>
          <MentionSuggestions 
            suggestions={suggestions} 
            onSelect={handleSelectMention} 
            isLoading={loadingMentions} 
          />
        </div>
      )}
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          ref={ref}
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={handleTextChange}
          onKeyDown={(e) => handleKeyDown(e, false)}
          style={styles.input}
          rows={1}
        />
        <button type="submit" style={styles.button} disabled={!newComment.trim()}>
          Publicar
        </button>
      </form>
    </div>
  );
});

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    padding: '0 12px', // Centering buffer
    width: '100%',
    boxSizing: 'border-box'
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    fontSize: '0.9rem',
    resize: 'none',
    overflow: 'hidden',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    minHeight: '42px',
    backgroundColor: '#f8fafc'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '24px',
    border: 'none',
    backgroundColor: '#000', // Black for premium look
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
};

export default CommentForm;
