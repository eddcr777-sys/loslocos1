import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Post as PostType } from '../../services/api';
import Post from '../../components/posts/Post';
import Button from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import './PostDetailPage.css';

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extraer el postId y opcionalmente el commentId de la URL
  // El entity_id puede venir como "post_id" o "post_id?c=comment_id" (para notificaciones nuevas)
  // O incluso puede ser un ID de comentario directamente (para notificaciones viejas)
  const [actualPostId, setActualPostId] = useState<string | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      if (postId.includes('?')) {
        const [id, query] = postId.split('?');
        const params = new URLSearchParams(query);
        setActualPostId(id);
        setTargetCommentId(params.get('c'));
      } else {
        setActualPostId(postId);
        // Verificar si hay ?c= en la URL real (por si react-router lo separó)
        const params = new URLSearchParams(window.location.search);
        if (params.has('c')) {
          setTargetCommentId(params.get('c'));
        }
      }
    }
  }, [postId]);

  useEffect(() => {
    if (actualPostId) {
      loadPost(actualPostId);
    }
  }, [actualPostId]);

  const loadPost = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar cargar como Post directo
      let { data, error } = await api.getPost(id);
      
      // Si falla o no existe, y parece ser un ID (o simplemente por si acaso),
      // intentamos buscar si es un ID de comentario (fallback para notificaciones viejas)
      if (!data) {
        console.log('Post not found, trying fallback as comment ID...');
        const fallback = await api.getPostByCommentId(id);
        if (fallback.data) {
          data = fallback.data;
          setTargetCommentId(id); // El ID original era el comentario
        } else {
          setError('La publicación no existe o ha sido eliminada.');
          return;
        }
      }

      if (error) {
        setError(error.message);
      } else if (data) {
        setPost(data);
      }
    } catch (err: any) {
      console.error('Error loading post detail:', err);
      setError(err.message || 'Error desconocido al cargar la publicación.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Intentar volver atrás, si no hay historial ir a notificaciones
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/notifications');
    }
  };

  if (loading) {
    return (
      <div className="post-detail-container loading-container">
        <p>Cargando publicación...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-container error-container">
        <h2 className="error-message">¡Vaya! Algo salió mal</h2>
        <p>{error || 'No se encontró el post solicitado.'}</p>
        <Button onClick={handleBack} style={{ marginTop: '1rem' }}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="home-container" style={{ paddingTop: '0' }}>
      {/* Header fijo para el detalle del post */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <button 
          onClick={handleBack} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '50%',
            transition: 'background-color 0.2s',
            color: '#1e293b'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={22} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Publicación</h2>
      </div>

      <div className="feed-container" style={{ padding: '0 10px' }}>
        <Post 
          post={post} 
          onPostDeleted={() => navigate('/home')} 
          showCommentsByDefault={true}
          highlightCommentId={targetCommentId || undefined}
        />
        <div style={{ height: '40px' }} /> {/* Espacio extra al final */}
      </div>
    </div>
  );
};

export default PostDetailPage;