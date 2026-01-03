import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useProfile } from './useProfile';
import { api } from '../services/api';

export const useFullProfile = (userId: string | undefined, currentUser: any) => {
  const {
    viewProfile,
    userPosts,
    loadingPosts,
  } = useProfile(userId);

  const [isFollowing, setIsFollowing] = useState(false);
  const [actualProfileId, setActualProfileId] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });

  useEffect(() => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return;

    const fetchStatsAndFollowing = async () => {
      try {
        setIsFollowLoading(true);

        // Resolve real ID if username was provided
        let actualId = targetId;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .or(`id.eq.${targetId},username.eq.${targetId}`)
          .maybeSingle();

        if (profileData) {
          actualId = profileData.id;
        }
        setActualProfileId(actualId);

        // Fetch followers, following, and posts counts
        const { count: followersCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', actualId);
        const { count: followingCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', actualId);

        // Count only original posts (not quotes, not deleted)
        const { count: postsCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', actualId)
          .is('deleted_at', null)
          .is('original_post_id', null); // Exclude quotes

        setStats({
          followers: followersCount || 0,
          following: followingCount || 0,
          posts: postsCount || 0,
        });

        // Check if current user is following
        if (currentUser && actualId && currentUser.id !== actualId) {
          const { data, error } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', actualId)
            .maybeSingle();

          setIsFollowing(!error && !!data);
        }
      } catch (error) {
        console.error('Error cargando datos del perfil:', error);
      } finally {
        setIsFollowLoading(false);
      }
    };


    fetchStatsAndFollowing();
  }, [userId, currentUser]);


  const handleFollow = async () => {
    if (!currentUser || !actualProfileId || isFollowLoading) return;
    try {
      setIsFollowLoading(true);
      const { error } = await supabase.from('followers').insert({ follower_id: currentUser.id, following_id: actualProfileId });
      if (!error) {
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      } else {
        console.error('Error al seguir:', error);
        alert('Error al seguir: ' + error.message);
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !actualProfileId || isFollowLoading) return;
    try {
      setIsFollowLoading(true);
      const { error } = await supabase.from('followers').delete().eq('follower_id', currentUser.id).eq('following_id', actualProfileId);
      if (!error) {
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        console.error('Error al dejar de seguir:', error);
        alert('Error al dejar de seguir: ' + error.message);
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  return {
    viewProfile,
    userPosts,
    loadingPosts,
    isFollowing,
    isFollowLoading,
    stats,
    handleFollow,
    handleUnfollow,
  };
};