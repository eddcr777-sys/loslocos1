import React from 'react';
import Avatar from '../ui/Avatar';

interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
}

interface MentionSuggestionsProps {
  suggestions: User[];
  onSelect: (username: string) => void;
  isLoading: boolean;
}

const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({ suggestions, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Buscando usuarios...</div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div style={styles.container}>
      {suggestions.map((user) => (
        <div 
          key={user.id} 
          style={styles.item}
          onClick={() => onSelect(user.username)}
          className="mention-item"
        >
          <Avatar src={user.avatar_url} size="small" style={{ width: '24px', height: '24px' }} />
          <div style={styles.textContainer}>
            <span style={styles.fullName}>{user.full_name}</span>
            <span style={styles.username}>@{user.username}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute',
    bottom: '100%',
    left: '0',
    width: '100%',
    maxHeight: '200px',
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
    overflowY: 'auto',
    zIndex: 1000,
    marginBottom: '8px',
    animation: 'slideUp 0.2s ease-out'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid var(--border-color)'
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  fullName: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  username: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  loading: {
    padding: '12px',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)'
  }
};

export default MentionSuggestions;
