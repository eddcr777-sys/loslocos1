import React, { useState } from 'react';
import { api } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
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
          <Card onClick={() => setIsExpanded(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px' }}>
              <div style={{ flex: 1, backgroundColor: '#f0f2f5', padding: '10px 15px', borderRadius: '20px', color: '#65676b' }}>
                  ¿Qué estás pensando?
              </div>
              <Button size="small">Crear publicación</Button>
          </Card>
      );
  }

  return (
    <Card style={{ padding: '16px' }}>
      <div style={styles.header}>
          <h3>Crear publicación</h3>
          <button onClick={() => setIsExpanded(false)} style={styles.closeButton}>X</button>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="¿Qué estás pensando?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={styles.textarea}
          autoFocus
        />
        <div style={styles.footer}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            style={styles.fileInput}
            id="file-upload"
          />
          <label htmlFor="file-upload" style={styles.fileLabel}>
            {image ? '📷 Imagen seleccionada' : '📷 Añadir foto'}
          </label>
          <Button type="submit" disabled={loading || (!content && !image)}>
            {loading ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      borderBottom: '1px solid #e1e8ed',
      paddingBottom: '0.5rem'
  },
  closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1.2rem',
      color: '#65676b'
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    border: 'none',
    resize: 'none',
    fontSize: '1.1rem',
    outline: 'none',
    marginBottom: '1rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '1rem',
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    cursor: 'pointer',
    color: '#1d9bf0', // Updated to match Button primary color
    fontWeight: 500,
  },
};

export default CreatePost;
