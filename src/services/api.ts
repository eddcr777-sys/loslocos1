import { supabase } from '../utils/supabaseClient';

export interface Profile {
    id: string;
    full_name: string;
    username?: string;
    faculty?: string;
    avatar_url: string;
    bio: string;
    user_type?: 'common' | 'popular' | 'admin' | 'ceo' | 'institutional';
    university?: string;
    last_profile_update?: string;
    legal_accepted_at?: string;
    birth_date?: string;
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
    shares?: any; // Joined data (conteo)
    quotes?: any; // Joined data (conteo)
    user_has_liked?: boolean;
    is_official?: boolean;
    original_post?: Post; // Recursive definition for quoted post
    original_post_id?: string | null;
    deleted_at?: string | null;
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

export interface AdminLog {
    id: string;
    action: string;
    details: string;
    created_at: string;
    admin_id: string;
}

export interface ScheduledPost {
    id: string;
    content: string;
    scheduled_for: string;
    status: 'pending' | 'published' | 'failed';
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    actor_id: string;
    type: 'repost' | 'quote' | 'like' | 'official' | 'follow' | 'comment' | 'reply';
    post_id?: string;
    entity_id?: string;
    group_count: number;
    read: boolean;
    created_at: string;
    actor?: Profile;
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
            .select('id, full_name, username, avatar_url, user_type, faculty, bio, created_at')
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
    isUsernameUnique: async (username: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username.toLowerCase().trim())
            .maybeSingle();
        return { isUnique: !data, error };
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
        // Use the complete feed RPC that includes both posts and reposts
        const { data, error } = await supabase.rpc('get_complete_feed');

        if (error) {
            console.warn("Complete feed RPC failed. Falling back...", error);
            const { data: posts, error: standardError } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles (id, full_name, avatar_url, user_type, faculty),
                    likes (count),
                    comments (count),
                    shares (count),
                    quotes:posts!original_post_id (count),
                    original_post:posts!original_post_id (
                        *,
                        profiles (id, full_name, avatar_url, user_type),
                        likes (count),
                        comments (count),
                        shares (count),
                        quotes:posts!original_post_id (count)
                    )
                `)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            return { data: posts ? posts.map(api.mapPostData) : null, error: standardError };
        }

        // Map RPC result to Post structure
        return { data: data.map(api.mapPostData), error: null };
    },

    getPost: async (postId: string) => {
        if (!postId) return { data: null, error: new Error('ID de post no proporcionado') };

        // SMART RESOLUTION for Shares vs Posts
        const isShare = postId.startsWith('share_');
        const cleanId = isShare ? postId.replace('share_', '') : postId;

        // Robustness check for UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(cleanId.split('?')[0])) {
            return { data: null, error: new Error('ID inválido') };
        }

        const idToFetch = cleanId.split('?')[0];

        if (isShare) {
            const { data, error } = await supabase
                .from('shares')
                .select(`
                    id,
                    created_at,
                    user_id,
                    profiles:user_id (id, full_name, avatar_url, user_type, faculty),
                    posts (
                        *,
                        profiles (id, full_name, avatar_url, user_type, faculty),
                        likes (count),
                        comments (count),
                        shares (count),
                        quotes:posts!original_post_id (count),
                        original_post:posts!original_post_id (
                            *,
                            profiles (id, full_name, avatar_url, user_type)
                        )
                    )
                `)
                .eq('id', idToFetch)
                .maybeSingle();

            if (error) return { data: null, error };
            if (!data) return { data: null, error: null };

            // Map standard 'posts' relation to our internal 'original_post_data' structure
            // Note: Data.posts will be an object because it's a single relation (belongs to)
            const postData = Array.isArray(data.posts) ? data.posts[0] : data.posts;

            return {
                data: api.mapPostData({
                    share_id: data.id,
                    shared_at: data.created_at,
                    reposter_data: data.profiles,
                    original_post_data: postData
                }),
                error: null
            };
        }

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles (id, full_name, avatar_url, user_type, faculty),
                likes (count),
                comments (count),
                shares (count),
                quotes:posts!original_post_id (count),
                original_post:posts!original_post_id (
                    *,
                    profiles (id, full_name, avatar_url, user_type)
                )
            `)
            .eq('id', idToFetch)
            .maybeSingle();

        if (error) return { data: null, error };
        if (!data) return { data: null, error: null };

        return { data: api.mapPostData(data), error: null };
    },

    getPostByCommentId: async (commentId: string) => {
        if (!commentId) return { data: null, error: new Error('ID de comentario no proporcionado') };

        // Sanatize ID to get pure UUID
        const cleanCommentId = commentId.split('?')[0].replace('share_', '');

        // Robustness check for UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(cleanCommentId)) {
            return { data: null, error: new Error('ID de comentario inválido') };
        }

        // Primero buscamos el comment para obtener el post_id
        const { data: comment, error: commentError } = await supabase
            .from('comments')
            .select('post_id')
            .eq('id', cleanCommentId)
            .maybeSingle();

        if (commentError || !comment) {
            return { data: null, error: commentError || new Error('Comment not found') };
        }

        // Luego usamos getPost con ese post_id
        return api.getPost(comment.post_id);
    },

    // Helper para normalizar la estructura de los posts de diferentes fuentes (RPC vs Tablas)
    mapPostData: (p: any): any => {
        if (!p) return null;

        // Si viene del RPC get_profile_shares o de un mapeo de smart feed, es un wrapper virtual
        if ((p.share_id || p.is_repost_wrapper) && p.original_post_data) {
            return {
                id: p.share_id ? 'share_' + p.share_id : (p.id || 'virtual_' + Math.random()),
                user_id: p.reposter_data?.id || p.user_id,
                content: '',
                image_url: null,
                created_at: p.shared_at || p.created_at,
                profiles: p.reposter_data || p.profiles,
                likes: { count: 0 },
                comments: { count: 0 },
                shares: { count: 0 },
                original_post: api.mapPostData(p.original_post_data),
                original_post_id: p.original_post_data.id,
                is_repost_from_shares: true,
                is_repost: true
            };
        }

        // Si ya es un post normal, mapeamos sus campos
        const resolveCount = (val: any) => {
            if (val === undefined || val === null) return 0;
            if (typeof val === 'number') return val;
            if (Array.isArray(val)) {
                if (val.length === 0) return 0;
                if (val[0]?.count !== undefined) return val[0].count;
                return val.length;
            }
            if (typeof val === 'object' && val.count !== undefined) return val.count;
            return 0;
        };

        const likesCount = p.likes_count ?? resolveCount(p.likes);
        const commentsCount = p.comments_count ?? resolveCount(p.comments);
        const sharesCount = (p.shares_count ?? resolveCount(p.shares)) + resolveCount(p.quotes);

        return {
            ...p,
            profiles: p.profiles || p.author_data,
            likes: { count: likesCount },
            comments: { count: commentsCount },
            shares: { count: sharesCount },
            original_post: p.original_post_data ? api.mapPostData(p.original_post_data) :
                (p.original_post ? api.mapPostData(p.original_post) : null),
            is_repost_from_shares: p.is_repost || p.is_repost_from_shares || (!!p.original_post && !p.content)
        };
    },

    getUserPosts: async (userId: string) => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles (id, full_name, avatar_url, user_type, faculty),
                likes (count),
                comments (count),
                shares (count),
                quotes:posts!original_post_id (count),
                original_post:posts!original_post_id (
                    *,
                    profiles (id, full_name, avatar_url, user_type),
                    likes (count),
                    comments (count),
                    shares (count),
                    quotes:posts!original_post_id (count)
                )
            `)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) return { data: null, error };
        return { data: data.map(api.mapPostData), error: null };
    },

    createPost: async (content: string, userId: string, imageUrl: string | null = null, isOfficial: boolean = false, originalPostId: string | null = null) => {
        // SEGURIDAD: Sanitización contra XSS y validación de contenido
        const sanitizedContent = content ? content.replace(/<[^>]*>?/gm, '').trim() : '';

        if (!sanitizedContent && !imageUrl && !originalPostId) {
            return { error: { message: 'La publicación no puede estar vacía.' } };
        }

        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: userId,
                content: sanitizedContent,
                image_url: imageUrl,
                is_official: isOfficial,
                original_post_id: originalPostId
            })
            .select()
            .single();

        // If it's a quote, increment share count of original
        if (!error && originalPostId) {
            await supabase.rpc('increment_shares_count', { post_id_param: originalPostId });
        }

        return { data, error };
    },

    deletePost: async (postId: string) => {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);
        return { error };
    },

    sharePost: async (postId: string) => {
        // Increment share count
        const { error } = await supabase.rpc('increment_shares_count', { post_id_param: postId });
        return { error };
    },

    // --- LIKES ---
    toggleLike: async (postId: string, userId: string) => {
        const cleanId = postId.startsWith('share_') ? postId.replace('share_', '') : postId;
        // Check if liked
        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', cleanId)
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
                .insert({ post_id: cleanId, user_id: userId });
            return { data: { liked: true }, error };
        }
    },

    getLikesCount: async (postId: string) => {
        const cleanId = postId.startsWith('share_') ? postId.replace('share_', '') : postId;
        const { count, error } = await supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', cleanId);
        return { count, error };
    },

    checkUserLiked: async (postId: string, userId: string) => {
        const cleanId = postId.startsWith('share_') ? postId.replace('share_', '') : postId;
        const { data, error } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', cleanId)
            .eq('user_id', userId)
            .maybeSingle();
        return { liked: !!data, error };
    },

    getSharesCount: async (postId: string) => {
        const cleanId = postId.startsWith('share_') ? postId.replace('share_', '') : postId;
        const { count, error } = await supabase
            .from('shares')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', cleanId);
        return { count, error };
    },

    checkUserReposted: async (postId: string, userId: string) => {
        const cleanId = postId.startsWith('share_') ? postId.replace('share_', '') : postId;
        const { data, error } = await supabase
            .from('shares')
            .select('id')
            .eq('post_id', cleanId)
            .eq('user_id', userId)
            .maybeSingle();
        return { reposted: !!data, error };
    },

    // --- COMMENTS ---
    getComments: async (postId: string) => {
        const cleanId = postId.startsWith('share_') ? postId.replace('share_', '') : postId;
        const { data, error } = await supabase
            .from('comments')
            .select(`
        *,
        profiles (id, full_name, avatar_url, user_type)
      `)
            .eq('post_id', cleanId)
            .order('created_at', { ascending: true });
        return { data, error };
    },

    addComment: async (postId: string, content: string, userId: string, parentId: string | null = null) => {
        const cleanId = postId.startsWith('share_') ? postId.replace('share_', '') : postId;
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: cleanId,
                user_id: userId,
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
            const { error } = await supabase.rpc('broadcast_official_announcement', {
                title_param: title,
                content_param: content,
                entity_id_param: entityId
            });

            if (error) throw error;
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
            .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
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

    getFollowers: async (userId: string) => {
        const { data, error } = await supabase
            .from('followers')
            .select('follower_id')
            .eq('following_id', userId);

        if (error || !data) return { data: [], error };

        const ids = data.map(f => f.follower_id);
        if (ids.length === 0) return { data: [], error: null };

        const { data: profiles, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', ids);

        return { data: profiles, error: pError };
    },

    getFollowing: async (userId: string) => {
        const { data, error } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', userId);

        if (error || !data) return { data: [], error };

        const ids = data.map(f => f.following_id);
        if (ids.length === 0) return { data: [], error: null };

        const { data: profiles, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', ids);

        return { data: profiles, error: pError };
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

    createStory: async (userId: string, imageUrl: string | null, content?: string, background?: string) => {
        const { data, error } = await supabase
            .from('stories')
            .insert({
                user_id: userId,
                image_url: imageUrl,
                content: content,
                background: background
            })
            .select()
            .single();
        return { data, error };
    },

    deleteStory: async (storyId: string, userId: string) => {
        const { error } = await supabase
            .from('stories')
            .delete()
            .eq('id', storyId)
            .eq('user_id', userId);
        return { error };
    },

    // --- ADMIN / STATS ---
    getSystemStats: async () => {
        try {
            // Llamada al RPC get_system_stats()
            const { data, error } = await supabase.rpc('get_system_stats');

            if (error) {
                if (error.code === '42501' || error.message.includes('permission')) {
                    console.error('RLS Error: Permission denied to access system stats.');
                    return { error: { message: 'No tienes permiso para ver las estadísticas del sistema.', code: 'FORBIDDEN' } };
                }
                throw error;
            }

            if (data) {
                console.log('DEBUG: Resultado Real de la DB:', data);
                return {
                    usersCount: data.users_count ?? data.usersCount ?? 0,
                    postsCount: data.posts_count ?? data.postsCount ?? 0,
                    commentsCount: data.comments_count ?? data.commentsCount ?? 0,
                    error: null
                };
            }

            // Fallback manual si el RPC falla o no devuelve datos
            const [profiles, posts, comments] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('posts').select('id', { count: 'exact', head: true }).is('deleted_at', null),
                supabase.from('comments').select('id', { count: 'exact', head: true })
            ]);

            return {
                usersCount: profiles.count || 0,
                postsCount: posts.count || 0,
                commentsCount: comments.count || 0,
                error: (profiles.error || posts.error || comments.error) ? { message: 'Permiso insuficiente parcial', code: 'RLS_LIMIT' } : null
            };
        } catch (error: any) {
            console.error('Critical Stats Error:', error);
            return { error: { message: error.message || 'Error desconocido al cargar estadísticas' } };
        }
    },

    getOfficialPosts: async () => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles (id, full_name, avatar_url, user_type),
                likes (count),
                comments (count),
                shares (count),
                quotes:posts!original_post_id (count)
            `)
            .eq('is_official', true)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    // --- ADMIN TOOLS (REAL DATA) ---
    logAdminAction: async (userId: string, action: string, details: string, targetId?: string) => {
        await supabase.from('admin_logs').insert({
            action,
            details,
            target_id: targetId,
            admin_id: userId
        });
    },

    getAdminLogs: async (limit: number = 20) => {
        const { data, error } = await supabase
            .from('admin_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    getDashboardAnalytics: async () => {
        // Calls the RPC we defined in SQL
        const { data, error } = await supabase.rpc('get_weekly_growth');
        return { data, error };
    },

    // --- SCHEDULING (REAL DATA) ---
    schedulePost: async (userId: string, content: string, date: string, isOfficial: boolean = false) => {
        const { data, error } = await supabase.from('scheduled_posts').insert({
            user_id: userId,
            content,
            scheduled_for: date,
            is_official: isOfficial,
            status: 'pending'
        }).select().single();

        return { data, error };
    },

    getScheduledPosts: async (userId: string) => {
        const { data, error } = await supabase
            .from('scheduled_posts')
            .select('*')
            .eq('user_id', userId)
            .order('scheduled_for', { ascending: true });
        return { data, error };
    },

    deleteScheduledPost: async (id: string) => {
        const { error } = await supabase.from('scheduled_posts').delete().eq('id', id);
        return { error };
    },
    // --- SETTINGS (NEW) ---
    getSettings: async (userId: string) => {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        return { data, error };
    },

    updateSettings: async (userId: string, settings: any) => {
        // Upsert allows creating the row if it doesn't exist yet
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({ user_id: userId, ...settings })
            .select()
            .single();
        return { data, error };
    },

    deleteUserAccount: async () => {
        // Calls the RPC we defined in SQL
        const { error } = await supabase.rpc('delete_user_account');
        return { error };
    },

    // --- SHARING & ADVANCED POSTS ---
    toggleRepost: async (postId: string) => {
        const { data, error } = await supabase.rpc('toggle_repost', { post_id_param: postId });
        return { data, error };
    },

    softDeletePost: async (postId: string) => {
        const { data, error } = await supabase.rpc('soft_delete_post', { post_id_param: postId });
        return { data, error };
    },

    getProfileShares: async (userId: string) => {
        const { data, error } = await supabase.rpc('get_profile_shares', { user_id_param: userId });
        if (error) return { data: null, error };
        return { data: data.map(api.mapPostData), error: null };
    },

    // --- SMART FEED (Algoritmo Avanzado) ---
    getSmartFeed: async () => {
        // Try getting the session for the current user
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        // If not logged in, fallback to generic complete feed
        if (!userId) {
            return api.getPosts();
        }

        // Logic to get "Following Feed" (Chronological) which includes Reposts
        try {
            // 1. Get IDs of people I follow
            const { data: followingData, error: followError } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', userId);

            if (followError) throw followError;

            const followingIds = followingData.map(f => f.following_id);
            followingIds.push(userId); // Add self to see my own posts/reposts

            // 2. Fetch posts from these users 
            const postsPromise = supabase
                .from('posts')
                .select(`
                    *,
                    profiles (id, full_name, avatar_url, user_type, faculty),
                    likes (count),
                    comments (count),
                    shares (count),
                    quotes:posts!original_post_id (count),
                    original_post:posts!original_post_id (
                        *,
                        profiles (id, full_name, avatar_url, user_type),
                        likes (count),
                        comments (count),
                        shares (count),
                        quotes:posts!original_post_id (count)
                    )
                `)
                .in('user_id', followingIds)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(50);

            // 3. Fetch SHARES (reposts) from these users
            // Assuming 'shares' table exists and links post_id -> posts, user_id -> profiles
            const sharesPromise = supabase
                .from('shares')
                .select(`
                    id,
                    created_at,
                    user_id,
                    profiles:user_id (id, full_name, avatar_url, user_type, faculty),
                    post:post_id (
                        *,
                        profiles (id, full_name, avatar_url, user_type, faculty),
                        likes (count),
                        comments (count),
                        shares (count),
                        quotes:posts!original_post_id (count),
                        original_post:posts!original_post_id (
                            *,
                            profiles (id, full_name, avatar_url, user_type),
                            likes (count),
                            comments (count),
                            shares (count),
                            quotes:posts!original_post_id (count)
                        )
                    )
                `)
                .in('user_id', followingIds)
                .is('posts.deleted_at', null) // Only non-deleted
                .order('created_at', { ascending: false })
                .limit(50);

            const [postsResult, sharesResult] = await Promise.all([postsPromise, sharesPromise]);

            if (postsResult.error) throw postsResult.error;
            // If shares table doesn't exist or error, we might just ignore shares, but let's log it.
            if (sharesResult.error) {
                console.warn("Could not fetch shares for feed:", sharesResult.error);
            }

            // 4. Map Posts
            const mappedPosts = (postsResult.data || []).map((p: any) => ({
                ...api.mapPostData(p),
                type: 'post'
            }));

            // 5. Map Shares (Reposts)
            const mappedShares = (sharesResult.data || []).map((s: any) => {
                if (!s.post) return null;
                return api.mapPostData({
                    share_id: s.id,
                    shared_at: s.created_at,
                    reposter_data: s.profiles,
                    original_post_data: s.post
                });
            }).filter(Boolean);

            // 6. Merge and Sort
            const combinedFeed = [...mappedPosts, ...mappedShares].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return { data: combinedFeed, error: null };

        } catch (err: any) {
            console.error("Error fetching following feed, falling back to complete feed:", err);
            return api.getPosts();
        }
    },

    getTrendingPosts: async (period: 'day' | 'week' | 'month' | 'year' = 'day') => {
        const { data, error } = await supabase.rpc('get_trending_posts', { period_param: period });
        return { data, error };
    },

    updateTrendingPosts: async () => {
        const { data, error } = await supabase.rpc('update_trending_posts');
        return { data, error };
    }
};
