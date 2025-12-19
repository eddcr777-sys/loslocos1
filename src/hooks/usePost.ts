import { useState, useEffect, useCallback } from 'react';
import { api, Post as PostType } from '../services/api';

export const usePost = (post: PostType, user: any) => {
    const [likes, setLikes] = useState(post.likes ? (Array.isArray(post.likes) ? post.likes[0]?.count : post.likes.count) : 0);
    const [commentsCount, setCommentsCount] = useState(post.comments ? (Array.isArray(post.comments) ? post.comments[0]?.count : post.comments.count) : 0);
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
    }

    const handleLike = async () => {
        if (!user) {
            alert('Por favor, inicia sesión para dar me gusta');
            return;
        }
        const { data, error } = await api.toggleLike(post.id, user.id);
        if (!error && data?.liked) {
            setLiked(true);
            setLikes(likes + 1);
            await api.createNotification({
                user_id: post.user_id,
                actor_id: user.id,
                type: 'like',
                entity_id: post.id
            });
        } else if (!error && !data?.liked) {
            setLiked(false);
            setLikes(likes - 1);
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
