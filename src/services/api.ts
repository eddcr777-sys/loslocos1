import { supabase } from '../utils/supabaseClient';

export interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    user_type?: 'common' | 'popular' | 'admin';
}

export interface Post {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    profiles: Profile; // Joined data
    likes: any; // Joined data (puede ser array u objeto)
    comments?: any; // Joined data (conteo)
    user_has_liked?: boolean;
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    created_at: string;
    profiles: Profile;
}

export const api = {
    // --- PROFILES ---
    getProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    },

    updateProfile: async (userId: string, updates: Partial<Profile>) => {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        return { data, error };
    },

    getAllProfiles: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });
        return { data, error };
    },

    // --- POSTS ---
    getPosts: async () => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        profiles (id, full_name, avatar_url, user_type),
        likes (count),
        comments (count)
      `)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    getUserPosts: async (userId: string) => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        profiles (id, full_name, avatar_url, user_type),
        likes (count),
        comments (count)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    createPost: async (content: string, imageUrl: string | null) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'No authenticated user' } };

        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                content,
                image_url: imageUrl
            })
            .select()
            .single();
        return { data, error };
    },

    deletePost: async (postId: string) => {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);
        return { error };
    },

    // --- LIKES ---
    toggleLike: async (postId: string, userId: string) => {
        // Check if liked
        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();

        if (existingLike) {
            // Unlike
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('id', existingLike.id);
            return { data: { liked: false }, error };
        } else {
            // Like
            const { error } = await supabase
                .from('likes')
                .insert({ post_id: postId, user_id: userId });
            return { data: { liked: true }, error };
        }
    },

    getLikesCount: async (postId: string) => {
        const { count, error } = await supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', postId);
        return { count, error };
    },

    checkUserLiked: async (postId: string, userId: string) => {
        const { data, error } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();
        return { liked: !!data, error };
    },

    // --- COMMENTS ---
    getComments: async (postId: string) => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
        *,
        profiles (id, full_name, avatar_url, user_type)
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        return { data, error };
    },

    addComment: async (postId: string, content: string, parentId: string | null = null) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'No authenticated user' } };

        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                parent_id: parentId,
                content
            })
            .select(`
        *,
        profiles (id, full_name, avatar_url, user_type)
      `)
            .single();
        return { data, error };
    },

    deleteComment: async (commentId: string) => {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
        return { error };
    },

    // --- STORAGE ---
    uploadImage: async (file: File, bucket: 'posts' | 'avatars' = 'posts') => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            return { error: uploadError };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { data: publicUrl, error: null };
    },

    // --- NOTIFICATIONS ---
    getNotifications: async (userId: string) => {
        try {
            console.log('DEBUG: api.getNotifications - starting for user:', userId);

            // Intentar join primero
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    actor:profiles!actor_id (full_name, avatar_url, user_type)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                console.log('DEBUG: api.getNotifications - join success, count:', data.length);
                return { data, error: null };
            }

            console.warn('DEBUG: api.getNotifications - join failed (expected if schema is complex), error:', error);
            console.log('DEBUG: api.getNotifications - triggering manual fallback...');

            // Fallback manual si el join falla
            const { data: notifs, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (fetchError || !notifs) {
                console.error('DEBUG: api.getNotifications - fallback base fetch failed:', fetchError);
                return { data: notifs, error: fetchError };
            }

            console.log('DEBUG: api.getNotifications - fallback base success, count:', notifs.length);

            const actorIds = Array.from(new Set(notifs.map(n => n.actor_id)));
            console.log('DEBUG: api.getNotifications - enriching actors for IDs:', actorIds);

            const { data: actors, error: actorsError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, user_type')
                .in('id', actorIds);

            if (actorsError) {
                console.error('DEBUG: api.getNotifications - actors enrichment failed:', actorsError);
                // Retornar al menos las notificaciones sin actor
                return { data: notifs, error: null };
            }

            const enriched = notifs.map(n => ({
                ...n,
                actor: actors?.find(a => a.id === n.actor_id)
            }));

            console.log('DEBUG: api.getNotifications - fallback full success');
            return { data: enriched, error: null };
        } catch (err) {
            console.error('DEBUG: api.getNotifications - critical exception:', err);
            return { data: null, error: err as any };
        }
    },

    createNotification: async (notification: { user_id: string; actor_id: string; type: string; entity_id?: string }) => {
        if (notification.user_id === notification.actor_id) return;

        const { error } = await supabase
            .from('notifications')
            .insert(notification);
        return { error };
    },

    markNotificationRead: async (notificationId: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
        return { error };
    },

    markAllNotificationsAsRead: async (userId: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId);

        if (error) throw error;
    },

    // --- SEARCH / EXPLORE ---
    searchUsers: async (query: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${query}%`)
            .limit(20);
        return { data, error };
    },

    // --- TRENDS ---
    getTrendingPosts: async () => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles (id, full_name, avatar_url, user_type),
                likes (count)
             `)
            .order('created_at', { ascending: false })
            .limit(10);

        return { data, error };
    },

    // --- FOLLOW SYSTEM ---
    followUser: async (targetId: string, currentId: string) => {
        const { error } = await supabase
            .from('followers')
            .insert({ follower_id: currentId, following_id: targetId });
        return { error };
    },

    unfollowUser: async (targetId: string, currentId: string) => {
        const { error } = await supabase
            .from('followers')
            .delete()
            .match({ follower_id: currentId, following_id: targetId });
        return { error };
    },

    getFollowStatus: async (targetId: string, currentId: string) => {
        const { data, error } = await supabase
            .from('followers')
            .select('*')
            .match({ follower_id: currentId, following_id: targetId })
            .maybeSingle();
        return { following: !!data, error: error && error.code !== 'PGRST116' ? error : null };
    },

    getFollowCounts: async (userId: string) => {
        const { count: followersCount, error: error1 } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        const { count: followingCount, error: error2 } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        return {
            followers: followersCount || 0,
            following: followingCount || 0,
            error: error1 || error2
        };
    },

    getProfileById: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    }
};
