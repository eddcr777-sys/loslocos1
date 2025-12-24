import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './StoryViewer.css';

interface StoryViewerProps {
  stories: any[];
  initialIndex: number;
  onClose: () => void;
  onStoryDeleted?: () => void;
  onAddStory?: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose, onStoryDeleted, onAddStory }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const storyDuration = 5000; // 5 seconds

  const currentStory = stories[currentIndex];
  const isOwner = user?.id === currentStory?.user_id;

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
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
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

    const { error } = await api.deleteStory(currentStory.id);
    if (error) {
      alert('Error al eliminar historia');
    } else {
      if (onStoryDeleted) onStoryDeleted();
      // Si hay más de una historia en el grupo, pasar a la siguiente o cerrar
      if (stories.length > 1) {
        handleNext();
      } else {
        onClose();
      }
    }
  };

  if (!currentStory) return null;

  return (
    <div className="story-viewer-overlay">
      <div className="story-viewer-content">
        {/* Progress Bars */}
        <div className="story-progress-container">
          {stories.map((_, idx) => (
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
            <Avatar src={currentStory.profiles.avatar_url} size="small" />
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
