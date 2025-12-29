import React, { useState } from 'react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { Image, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './CreatePost.css';

import { useMentions } from '../../hooks/useMentions';
import MentionSuggestions from '../../components/posts/MentionSuggestions';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface CreatePostProps {
  onPostCreated: () => void;
  quotedPost?: any; // Pass post to quote
  onCancelQuote?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, quotedPost, onCancelQuote }) => {
  const { profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(!!quotedPost);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const {
    showMentions,
    suggestions,
    loadingMentions,
    mentionQuery,
    handleInput,
    applyMention
  } = useMentions();

  // If quotedPost is passed, ensure we are expanded
  React.useEffect(() => {
    if (quotedPost) setIsExpanded(true);
  }, [quotedPost]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    handleInput(value, e.target.selectionStart || 0);
  };

  const handleSelectMention = (username: string) => {
    const newContent = applyMention(content, username, mentionQuery);
    setContent(newContent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image && !quotedPost) return;

    setLoading(true);
    let imageUrl = null;

    if (image) {
      const { data, error } = await api.uploadImage(image);
      if (error) {
        alert(`Error al subir la imagen: ${error.message}`);
        setLoading(false);
        return;
      }
      imageUrl = data;
    }

    if (!profile) return;
    const { error } = await api.createPost(
        content, 
        profile.id,
        imageUrl, 
        false, 
        quotedPost ? quotedPost.id : null
    );
    
    setLoading(false);
    if (error) {
     alert('Error al crear la publicación: ' + error.message);
    } else {
      setContent('');
      setImage(null);
      if (!quotedPost) setIsExpanded(false); // Close ONLY if not in specialized quote mode
      onPostCreated();
    }
  };

  if (!isExpanded && !quotedPost) {
      return (
          <div className="create-post-container" onClick={() => setIsExpanded(true)}>
            <div className="create-post-card">
                <Avatar 
                  src={profile?.avatar_url || DEFAULT_AVATAR} 
                  size="small" 
                  className="create-post-avatar"
                />
                <div className="create-post-bubble">
                    ¿Qué estás pensando, {profile?.full_name?.split(' ')[0]}?
                </div>
                <div className="create-post-action-hint">Publicar</div>
            </div>
          </div>
      );
  }

  return (
    <div className="create-post-container">
      <Card className="create-post-expanded">
        <div className="create-post-header">
            <h3>{quotedPost ? 'Citar Publicación' : 'Nueva publicación'}</h3>
            <button onClick={() => {
                if(onCancelQuote) onCancelQuote();
                setIsExpanded(false);
            }} className="create-post-close">
              <X size={18} />
            </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="create-post-body">
            <Avatar 
              src={profile?.avatar_url || DEFAULT_AVATAR} 
              size="medium" 
            />
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                placeholder={quotedPost ? "Agrega un comentario..." : `¿Qué hay de nuevo, ${profile?.full_name?.split(' ')[0]}?`}
                value={content}
                onChange={handleTextChange}
                className="create-post-textarea"
                autoFocus={!quotedPost}
              />
              {showMentions && (
                <MentionSuggestions 
                  suggestions={suggestions} 
                  onSelect={handleSelectMention} 
                  isLoading={loadingMentions} 
                />
              )}
            </div>
          </div>

          {quotedPost && (
             <div className="quoted-post-preview" style={{ margin: '0 1rem 1rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)', fontSize: '0.9rem' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Citando a {quotedPost.profiles?.full_name}:</strong>
                <p style={{ margin: 0, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quotedPost.content}</p>
             </div>
          )}

          <div className="create-post-footer">
            {!quotedPost && (
                <>
                <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="create-post-file-input"
                id="file-upload"
                />
                <label htmlFor="file-upload" className="create-post-file-label">
                <Image size={18} />
                {image ? 'Imagen lista' : 'Añadir foto'}
                </label>
                </>
            )}
            
            <Button 
              type="submit" 
              className="post-submit-btn"
              disabled={loading || (!content && !image && !quotedPost)}
            >
              {loading ? '...' : <><Send size={16} /> {quotedPost ? 'Citar' : 'Publicar'}</>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreatePost;
