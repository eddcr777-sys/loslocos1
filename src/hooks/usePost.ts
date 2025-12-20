import { useState, useEffect, useCallback } from 'react';
import { api, Post } from '../services/api';
import { User } from '@supabase/supabase-js';

export const usePost = (post: Post, user: User | null) => {
  // Inicializar contadores manejando la estructura de datos de Supabase (puede ser array u objeto)
  const [likes, setLikes] = useState<number>(
    post.likes ? (Array.isArray(post.likes) ? post.likes[0]?.count : post.likes.count) : 0
  );
  
  const [commentsCount, setCommentsCount] = useState<number>(
    post.comments ? (Array.isArray(post.comments) ? post.comments[0]?.count : post.comments.count) : 0
  );
  
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (user) {
      checkLiked();
    }
  }, [user, post.id]);

  const checkLiked = async () => {
    if (!user) return;
    const { liked } = await api.checkUserLiked(post.id, user.id);
    setLiked(liked);
  };

  const handleLike = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para dar me gusta');
      return;
    }

    // Actualización optimista para mejor UX
    const previousLiked = liked;
    const previousLikes = likes;
    
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);

    const { data, error } = await api.toggleLike(post.id, user.id);

    if (error) {
      // Revertir si hay error
      setLiked(previousLiked);
      setLikes(previousLikes);
      console.error('Error al dar like:', error);
    } else {
      // Si se dio like exitosamente, enviar notificación
      if (data?.liked) {
        await api.createNotification({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'like',
          entity_id: post.id
        });
      }
    }
  };

  const handleCommentsUpdate = useCallback((count: number) => {
    setCommentsCount(count);
  }, []);

  return {
    likes,
    commentsCount,
    liked,
    showComments,
    setShowComments,
    handleLike,
    handleCommentsUpdate
  };
};