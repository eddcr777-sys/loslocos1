import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Post as PostType } from '../../services/api';
import Post from '../../components/posts/Post';
import Button from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import './PostDetailPage.css';
import SubPageHeader from '../../components/layout/SubPageHeader';
import useMediaQuery from '../../useMediaQuery';

import CreatePost from '../../pages/CrearPost/CreatePost';
import { X } from 'lucide-react';

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [error, setError] = useState<string | null>(null);

  const [quotePost, setQuotePost] = useState<PostType | null>(null);

  const handlePostCreated = () => {
    setQuotePost(null);
    if (actualPostId) loadPost(actualPostId);
    alert("Post creado con éxito");
  };

  // Extraer el postId y opcionalmente el commentId de la URL
  // El entity_id puede venir como "post_id" o "post_id?c=comment_id" (para notificaciones nuevas)
  // O incluso puede ser un ID de comentario directamente (para notificaciones viejas)
  const [actualPostId, setActualPostId] = useState<string | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);
  const [shouldHighlightPost, setShouldHighlightPost] = useState(false);


  useEffect(() => {
    if (postId) {
      if (postId.includes('?')) {
        const [id, query] = postId.split('?');
        const params = new URLSearchParams(query);
        setActualPostId(id);
        setTargetCommentId(params.get('c'));
      } else {
        setActualPostId(postId);
        const params = new URLSearchParams(window.location.search);
        if (params.has('c')) {
          setTargetCommentId(params.get('c'));
        } else {
          setShouldHighlightPost(true);
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
      
      if (error) {
        setError(error.message);
        return;
      }

      if (!data) {
        // Fallback for old notifications only
        const fallback = await api.getPostByCommentId(id);
        if (fallback.data) {
          data = fallback.data;
          setTargetCommentId(id);
        } else {
          setError('La publicación no existe o no tienes permiso para verla.');
          return;
        }
      }

      if (data) {
        setPost(data);
      }
    } catch (err: any) {
      console.error('Error loading post detail:', err);
      setError(err.message || String(err));
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
    <div className="home-container" style={{ 
      paddingTop: isMobile ? '1rem' : '0' 
    }}>
      {!isMobile && (
         <div style={{ marginBottom: '1.5rem' }}>
            <SubPageHeader title="Publicación" showBackButton={true} />
         </div>
      )}
      {/* Mobile spacing handled by Layout (70px) + paddingTop (1rem) = ~86px total from top */}

      <div className="feed-container" style={{ padding: '0 10px' }}>
        <Post 
          key={post.id}
          post={post} 
          onPostDeleted={() => navigate('/home')} 
          showCommentsByDefault={true}
          highlightCommentId={targetCommentId || undefined}
          highlight={shouldHighlightPost}
          onRepost={(p) => setQuotePost(p)}
        />

        <div style={{ height: '40px' }} /> 
      </div>

      {/* Quote Modal Overlay */}
      {quotePost && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
        }} onClick={() => setQuotePost(null)}>
          <div style={{ width: '100%', maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setQuotePost(null)} style={{ color: 'white' }}>
                <X size={24} />
              </Button>
            </div>
            <CreatePost 
               onPostCreated={handlePostCreated}
               quotedPost={quotePost}
               onCancelQuote={() => setQuotePost(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetailPage;