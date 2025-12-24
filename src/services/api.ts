import { supabase } from '../utils/supabaseClient';

export interface Profile {
    id: string;
    full_name: string;
    username?: string;
    faculty?: string;
    avatar_url: string;
    bio: string;
    user_type?: 'common' | 'popular' | 'admin' | 'ceo' | 'institutional';
    last_profile_update?: string;
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
    is_official?: boolean;
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
    verifyAndUpgradeRole: async (key: string, userId: string) => {
        try {
            const { data, error } = await supabase.rpc('verify_and_upgrade_user_role', {
                input_key: key,
                user_id_param: userId
            });
            if (error) throw error;
            return data as { success: boolean, role?: 'admin' | 'institutional', message?: string };
        } catch (error) {
            console.error('Error in verification:', error);
            return { success: false, message: 'Fallo en la comunicación con el servidor' };
        }
    },
    getProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        return { data, error };
    },

    updateProfile: async (userId: string, updates: Partial<Profile>) => {
        // Restricted fields
        const isRestrictedChange = 'full_name' in updates || 'username' in updates || 'faculty' in updates;

        if (isRestrictedChange) {
            // Fetch current profile to check last_profile_update
            const { data: currentProfile } = await supabase
                .from('profiles')
                .select('full_name, username, faculty, last_profile_update')
                .eq('id', userId)
                .maybeSingle();

            if (currentProfile?.last_profile_update) {
                // Check if any restricted field actually changed
                const hasChanged =
                    (updates.full_name && updates.full_name !== currentProfile.full_name) ||
                    (updates.username && updates.username !== currentProfile.username) ||
                    (updates.faculty && updates.faculty !== currentProfile.faculty);

                if (hasChanged) {
                    const lastUpdate = new Date(currentProfile.last_profile_update);
                    const now = new Date();
                    const daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysSinceLastUpdate < 30) {
                        const daysRemaining = 30 - daysSinceLastUpdate;
                        return {
                            data: null,
                            error: {
                                message: `Solo puedes cambiar tu nombre, usuario o facultad cada 30 días. Faltan ${daysRemaining} días.`
                            }
                        };
                    }
                    // Update the timestamp if we are allowed to change
                    updates.last_profile_update = new Date().toISOString();
                }
            } else if (currentProfile) {
                // First time update, set the timestamp
                updates.last_profile_update = new Date().toISOString();
            }
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .maybeSingle();
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

    getPost: async (postId: string) => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        profiles (id, full_name, avatar_url, user_type),
        likes (count),
        comments (count)
      `)
            .eq('id', postId)
            .maybeSingle();

        return { data, error };
    },

    getPostByCommentId: async (commentId: string) => {
        // Primero buscamos el comment para obtener el post_id
        const { data: comment, error: commentError } = await supabase
            .from('comments')
            .select('post_id')
            .eq('id', commentId)
            .maybeSingle();

        if (commentError || !comment) {
            return { data: null, error: commentError || new Error('Comment not found') };
        }

        // Luego usamos getPost con ese post_id
        return api.getPost(comment.post_id);
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

    createPost: async (content: string, imageUrl: string | null, isOfficial: boolean = false) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'No authenticated user' } };

        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                content,
                image_url: imageUrl,
                is_official: isOfficial
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
            .maybeSingle();

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
    broadcastNotification: async (title: string, content: string, entityId?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { error: { message: 'No authenticated user' } };

            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('id');

            if (pError) throw pError;

            if (profiles) {
                const notifications = profiles
                    .filter(p => p.id !== user.id)
                    .map(p => ({
                        user_id: p.id,
                        actor_id: user.id,
                        type: 'official',
                        entity_id: entityId,
                        title: title,
                        content: content.substring(0, 150),
                        read: false
                    }));

                const { error: nError } = await supabase
                    .from('notifications')
                    .insert(notifications);

                if (nError) throw nError;
            }
            return { success: true };
        } catch (error) {
            console.error('Broadcast error:', error);
            return { error };
        }
    },

    getNotifications: async (userId: string) => {
        try {
            // Realizamos la carga en dos pasos para evitar errores de join si la relación FK no está en el cache de Supabase
            const { data: notifs, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (fetchError || !notifs) {
                console.error('DEBUG: api.getNotifications - fetch failed:', fetchError);
                return { data: notifs, error: fetchError };
            }

            // Identificar IDs únicos de actores para enriquecer
            const actorIds = Array.from(new Set(notifs.map(n => n.actor_id).filter(id => !!id)));

            if (actorIds.length === 0) {
                return { data: notifs, error: null };
            }

            const { data: actors, error: actorsError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, user_type')
                .in('id', actorIds);

            if (actorsError) {
                console.error('DEBUG: api.getNotifications - profiles enrichment failed:', actorsError);
                // Retornamos las notificaciones aunque no tengan los datos del actor para no bloquear la UI
                return { data: notifs, error: null };
            }

            // Mapear perfiles a las notificaciones
            const enriched = notifs.map(n => ({
                ...n,
                actor: actors?.find(a => a.id === n.actor_id)
            }));

            return { data: enriched, error: null };
        } catch (err) {
            console.error('DEBUG: api.getNotifications - exception:', err);
            return { data: null, error: err as any };
        }
    },

    createNotification: async (notification: { user_id: string; actor_id: string; type: string; entity_id?: string }) => {
        if (notification.user_id === notification.actor_id) return { error: null };

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
            .maybeSingle();
        return { data, error };
    },

    // --- STORIES ---
    getStories: async () => {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('stories')
            .select(`
                *,
                profiles (id, full_name, avatar_url)
            `)
            .gt('expires_at', now)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    createStory: async (imageUrl: string | null, content?: string, background?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'No authenticated user' } };

        const { data, error } = await supabase
            .from('stories')
            .insert({
                user_id: user.id,
                image_url: imageUrl,
                content: content,
                background: background
            })
            .select()
            .single();
        return { data, error };
    },

    deleteStory: async (storyId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'No authenticated user' } };

        console.log('Attempting to delete story:', storyId, 'for user:', user.id);

        const { error, status, statusText } = await supabase
            .from('stories')
            .delete()
            .eq('id', storyId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Supabase delete error:', error);
        } else {
            console.log('Delete response status:', status, statusText);
        }

        return { error };
    },

    // --- ADMIN / STATS ---
    getSystemStats: async () => {
        const [profiles, posts, comments] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('posts').select('id', { count: 'exact', head: true }),
            supabase.from('comments').select('id', { count: 'exact', head: true })
        ]);

        return {
            usersCount: profiles.count || 0,
            postsCount: posts.count || 0,
            commentsCount: comments.count || 0,
            error: profiles.error || posts.error || comments.error
        };
    },

    getOfficialPosts: async () => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles (id, full_name, avatar_url, user_type),
                likes (count),
                comments (count)
            `)
            .eq('is_official', true)
            .order('created_at', { ascending: false });
        return { data, error };
    }
};
