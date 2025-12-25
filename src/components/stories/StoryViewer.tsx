import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './StoryViewer.css';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface StoryViewerProps {
  stories: any[];
  initialIndex: number;
  onClose: () => void;
  onStoryDeleted?: () => void;
  onAddStory?: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories: initialStories, initialIndex, onClose, onStoryDeleted, onAddStory }) => {
  const { user } = useAuth();
  const [localStories, setLocalStories] = useState(initialStories);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const storyDuration = 5000; // 5 seconds

  const currentStory = localStories[currentIndex];
  const isOwner = user?.id === currentStory?.user_id;

  // Sincronizar si las props cambian externamente (opcional, pero útil)
  useEffect(() => {
    if (initialStories.length !== localStories.length) {
        setLocalStories(initialStories);
        // Si el índice actual ya no es válido, ajustarlo
        if (currentIndex >= initialStories.length) {
            setCurrentIndex(Math.max(0, initialStories.length - 1));
        }
    }
  }, [initialStories]);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, localStories.length]); // Añadir localStories.length como dep

  const handleNext = () => {
    if (currentIndex < localStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDelete = async () => {
    if (!currentStory) return;
    if (!window.confirm('¿Eliminar esta historia?')) return;

    try {
      const { error } = await api.deleteStory(currentStory.id);
      if (error) {
        alert('Error al eliminar historia');
        return;
      }

      // Notificar al padre para que refresque la lista global
      if (onStoryDeleted) onStoryDeleted();

      // Actualizar localmente para feedback inmediato
      const newLocalStories = localStories.filter(s => s.id !== currentStory.id);
      
      if (newLocalStories.length === 0) {
        onClose();
      } else {
        setLocalStories(newLocalStories);
        // Si eliminamos la última, retroceder una
        if (currentIndex >= newLocalStories.length) {
          setCurrentIndex(newLocalStories.length - 1);
        }
        // El useEffect de progress se encargará de reiniciar a 0
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error inesperado al eliminar');
    }
  };

  if (!currentStory) return null;

  return (
    <div className="story-viewer-overlay">
      <div className="story-viewer-content">
        {/* Progress Bars */}
        <div className="story-progress-container">
          {localStories.map((_: any, idx: number) => (
            <div key={idx} className="story-progress-bar-bg">
              <div 
                className="story-progress-bar-fill"
                style={{ 
                  width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-user">
            <Avatar src={currentStory.profiles.avatar_url || DEFAULT_AVATAR} size="small" />
            <div className="story-viewer-info">
              <span className="story-viewer-name">
                {currentStory.profiles.full_name}
                {currentStory.profiles.faculty && (
                  <span 
                    className="faculty-badge-mini"
                    style={{ backgroundColor: `var(--faculty-${currentStory.profiles.faculty.toLowerCase().substring(0,3)})` }}
                  >
                    {currentStory.profiles.faculty}
                  </span>
                )}
              </span>
              <span className="story-viewer-time">
                {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="story-viewer-actions">
            {isOwner && (
              <>
                <button className="story-action-btn" onClick={() => onAddStory && onAddStory()} title="Añadir otra historia">
                  <Plus size={20} />
                </button>
                <button className="story-delete-btn" onClick={handleDelete} title="Eliminar historia">
                  <Trash2 size={20} />
                </button>
              </>
            )}
            <button className="story-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Media */}
        <div 
          className="story-media-container" 
          style={{ background: currentStory.background || '#000' }}
        >
          {currentStory.image_url ? (
            <img src={currentStory.image_url} alt="Story" className="story-image" />
          ) : (
            <div className="story-text-only">
              <p>{currentStory.content}</p>
            </div>
          )}
          
          {currentStory.image_url && currentStory.content && (
            <div className="story-text-overlay">
              <p>{currentStory.content}</p>
            </div>
          )}
        </div>

        {/* Navigation Areas (Touch Friendly) */}
        <div className="story-nav-left" onClick={handlePrev} />
        <div className="story-nav-right" onClick={handleNext} />

        {/* Desktop Navigation Arrows */}
        <button className="story-arrow left" onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft size={32} />
        </button>
        <button className="story-arrow right" onClick={handleNext}>
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
};

export default StoryViewer;
