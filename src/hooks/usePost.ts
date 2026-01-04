import { useState, useEffect, useCallback } from 'react';
import { api, Post } from '../services/api';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

export const usePost = (post: Post, user: User | null, initialShowComments: boolean = false) => {
  const [likes, setLikes] = useState<number>(
    post.likes_count !== undefined ? post.likes_count :
      (post.likes ? (Array.isArray(post.likes) ? (post.likes[0]?.count || 0) : (post.likes.count || 0)) : 0)
  );

  const [commentsCount, setCommentsCount] = useState<number>(
    post.comments_count !== undefined ? post.comments_count :
      (post.comments ? (Array.isArray(post.comments) ? (post.comments[0]?.count || 0) : (post.comments.count || 0)) : 0)
  );

  const [sharesCount, setSharesCount] = useState<number>(
    post.shares ? (Array.isArray(post.shares) ? (post.shares[0]?.count || 0) : (post.shares.count || 0)) : 0
  );

  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [showComments, setShowComments] = useState(initialShowComments);

  useEffect(() => {
    if (user) {
      checkLiked();
      checkReposted();
    }

    const cleanId = post.id.replace('share_', '');
    const channelName = `post-interactions-${cleanId}`;

    const interactionChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        async (payload) => {
          const pid = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
          if (pid === cleanId) {
            const { count } = await api.getLikesCount(post.id);
            setLikes(count || 0);
            checkLiked();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        async (payload) => {
          const pid = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
          if (pid === cleanId) {
            const { data } = await api.getComments(post.id);
            if (data) setCommentsCount(data.length);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shares' },
        async (payload) => {
          const pid = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
          if (pid === cleanId) {
            const { count } = await api.getSharesCount(post.id);
            setSharesCount(count || 0);
            checkReposted();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(interactionChannel);
    };
  }, [user, post.id]);

  const checkLiked = async () => {
    if (!user) return;
    const { liked } = await api.checkUserLiked(post.id, user.id);
    setLiked(liked);
  };

  const checkReposted = async () => {
    if (!user) return;
    const { reposted } = await api.checkUserReposted(post.id, user.id);
    setReposted(reposted);
  };

  const handleLike = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para dar me gusta');
      return;
    }

    const previousLiked = liked;
    const previousLikes = likes;

    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);

    const { data, error } = await api.toggleLike(post.id, user.id);

    if (error) {
      setLiked(previousLiked);
      setLikes(previousLikes);
    }
  };

  const handleCommentsUpdate = useCallback((count: number) => {
    setCommentsCount(count);
  }, []);

  return {
    likes,
    commentsCount,
    sharesCount,
    liked,
    reposted,
    showComments,
    setShowComments,
    handleLike,
    handleCommentsUpdate
  };
};