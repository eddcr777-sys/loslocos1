import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Image } from 'lucide-react';
import { api } from '../services/api';
import './CreatePostModal.css';
import { useAuth } from '../context/AuthContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;

      if (image) {
        const { data, error: uploadError } = await api.uploadImage(image);
        if (uploadError) throw uploadError;
        imageUrl = data;
      }

      const { error } = await api.createPost(content.trim(), imageUrl);

      if (error) throw error;

      setContent('');
      setImage(null);
      setPreview(null);
      onClose();
      if (onPostCreated) {
        onPostCreated();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear la publicación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nueva publicación</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <textarea
            className="modal-textarea"
            placeholder={`¿Qué estás pensando hoy, ${profile?.full_name?.split(' ')[0]}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />
          {preview && (
            <div style={{ position: 'relative', marginTop: '1rem' }}>
              <img 
                src={preview} 
                alt="Preview" 
                style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }} 
              />
              <button 
                onClick={removeImage}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="file"
              id="modal-image-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="modal-image-upload" style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', backgroundColor: 'var(--accent-soft, #eff6ff)' }} title="Añadir imagen">
              <Image size={24} />
            </label>
          </div>

          <button 
            className="modal-submit-btn" 
            onClick={handleSubmit}
            disabled={(!content.trim() && !image) || isSubmitting}
          >
            {isSubmitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreatePostModal;