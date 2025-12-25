import React, { useState } from 'react';
import { api } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { Image, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './CreatePost.css';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setLoading(true);
    let imageUrl = null;

    if (image) {
      const { data, error } = await api.uploadImage(image);
      if (error) {
        console.error("Upload error:", error);
        alert(`Error al subir la imagen: ${error.message}`);
        setLoading(false);
        return;
      }
      imageUrl = data;
    }

    const { error } = await api.createPost(content, imageUrl);
    
    setLoading(false);
    if (error) {
    alert('Error al crear la publicación: ' + error.message);
    } else {
      setContent('');
      setImage(null);
      setIsExpanded(false); // Close after success
      onPostCreated();
    }
  };

  if (!isExpanded) {
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
            <h3>Nueva publicación</h3>
            <button onClick={() => setIsExpanded(false)} className="create-post-close">
              <X size={18} />
            </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="create-post-body">
            <Avatar 
              src={profile?.avatar_url || DEFAULT_AVATAR} 
              size="medium" 
            />
            <textarea
              placeholder={`¿Qué hay de nuevo, ${profile?.full_name?.split(' ')[0]}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="create-post-textarea"
              autoFocus
            />
          </div>
          <div className="create-post-footer">
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
            <Button 
              type="submit" 
              className="post-submit-btn"
              disabled={loading || (!content && !image)}
            >
              {loading ? '...' : <><Send size={16} /> Publicar</>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreatePost;
