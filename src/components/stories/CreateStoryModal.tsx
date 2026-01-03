import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Type, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './CreateStoryModal.css';

interface CreateStoryModalProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

const backgroundPresets = [
  'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  '#0f172a',
  '#7c3aed',
  '#db2777'
];

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onStoryCreated }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'photo' | 'text'>('photo');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [background, setBackground] = useState(backgroundPresets[0]);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'photo' && !image) return;
    if (mode === 'text' && !content.trim()) return;

    setLoading(true);
    let imageUrl = null;

    if (mode === 'photo' && image) {
      const { data, error: uploadError } = await api.uploadImage(image, 'posts');
      if (uploadError) {
        alert('Error al subir la imagen');
        setLoading(false);
        return;
      }
      imageUrl = data;
    }

    if (!user) return;
    const { error: createError } = await api.createStory(
      user.id,
      imageUrl, 
      content, 
      mode === 'text' ? background : undefined
    );
    
    if (createError) {
      alert('Error al crear la historia');
    } else {
      onStoryCreated();
      onClose();
    }
    setLoading(false);
  };

  return createPortal(
    <div className="story-modal-overlay">
      <div className="story-modal-container">
        <div className="story-modal-header">
          <div className="mode-selector">
            <button 
              className={`mode-btn ${mode === 'photo' ? 'active' : ''}`}
              onClick={() => setMode('photo')}
            >
              <ImageIcon size={18} /> Multimedia
            </button>
            <button 
              className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
            >
              <Type size={18} /> Texto
            </button>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="story-modal-form">
          <div className="story-canvas-container" style={{ background: mode === 'text' ? background : '#f8fafc' }}>
            {mode === 'photo' ? (
              <>
                {preview ? (
                  <img src={preview} alt="Preview" className="story-creation-preview" />
                ) : (
                  <label htmlFor="story-upload" className="story-upload-placeholder">
                    <span>Subir foto o video</span>
                  </label>
                )}
                <input 
                  type="file" 
                  id="story-upload" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden-input" 
                />
              </>
            ) : (
              <textarea
                placeholder="Empieza a escribir..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="story-text-canvas-input"
                autoFocus
              />
            )}
          </div>

          {mode === 'text' && (
            <div className="bg-presets">
              {backgroundPresets.map((bg, i) => (
                <div 
                  key={i} 
                  className={`bg-preset-item ${background === bg ? 'active' : ''}`}
                  style={{ background: bg }}
                  onClick={() => setBackground(bg)}
                />
              ))}
            </div>
          )}

          {mode === 'photo' && preview && (
            <div className="story-input-container">
              <textarea
                placeholder="Añadir una descripción..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="story-textarea"
              />
            </div>
          )}

          <button 
            type="submit" 
            className="story-publish-btn" 
            disabled={(mode === 'photo' && !image) || (mode === 'text' && !content.trim()) || loading}
          >
            {loading ? 'Subiendo...' : <><Send size={18} /> Compartir ahora</>}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateStoryModal;
