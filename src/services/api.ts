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
    profiles: Profile;
    likes: { count: number };
    comments?: { count: number };
    shares?: { count: number };
    user_has_liked?: boolean;
    is_official?: boolean;
    original_post?: Post;
    original_post_id?: string | null;
    deleted_at?: string | null;
    is_quote?: boolean;
    item_type?: 'post' | 'share' | 'quote';
    likes_count?: number;
    comments_count?: number;
    shares_count?: number;
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: Profile;
    parent_id?: string | null;
}

export const api = {
    // --- PROFILES ---
    getProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, user_type, faculty, bio, created_at')
            .eq('id', userId)
            .maybeSingle();
        return { data, error };
    },

    getAllProfiles: async () => {
        const { data, error } = await supabase.from('profiles').select('*').order('full_name');
        return { data, error };
    },

    updateProfile: async (userId: string, updates: any) => {
        const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
        return { data, error };
    },

    isUsernameUnique: async (username: string) => {
        const { data, error } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
        return { isUnique: !data, error };
    },

    // --- MAPEO DE DATOS (EL MOTOR DE LA APP) ---
    mapPostData: (rawData: any): any => {
        if (!rawData) return null;
        const p = Array.isArray(rawData) ? rawData[0] : rawData;
        if (!p) return null;

        // 1. Resolución de Autor (Profiles)
        const rawProfiles = p.profiles || p.author || p.author_data || p.profiles_data || p.reposter_data;
        const authorProfile = Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles;

        // 2. Resolución de Post Original (para Citas y Reposts)
        const rawOriginal = p.original_post || p.original_post_data || p.post || p.original_post_content;
        const originalData = Array.isArray(rawOriginal) ? rawOriginal[0] : rawOriginal;

        // Mapeo recursivo del post original (si existe y no es el mismo post)
        // IMPORTANTE: Si el post original está eliminado, no lo mapeamos
        let mappedOriginal = null;
        if (originalData && originalData.id && originalData.id !== p.id) {
            // Si el post original fue eliminado, lo marcamos como null
            if (originalData.deleted_at) {
                console.warn('⚠️ Post original eliminado:', originalData.id);
                mappedOriginal = null;
            } else {
                mappedOriginal = api.mapPostData(originalData);
            }
        }
        // Eliminamos el log de error aquí porque ahora el frontend maneja la carga perezosa (Lazy Loading) si falta el dato.

        // 3. Limpieza de ID
        const cleanId = p.id ? p.id.toString().replace('share_', '').replace('quote_', '') : p.id;

        // 4. Identificación de Tipo
        const hasOriginalId = !!p.original_post_id;
        const hasContent = !!(p.content && p.content.trim());
        const isQuote = hasOriginalId && (hasContent || !!p.image_url || p.is_quote === true);
        const isRepost = !isQuote && hasOriginalId && !hasContent;

        // 5. Resolución de Contadores
        const resolveCount = (val: any) => {
            if (val === undefined || val === null) return 0;
            if (typeof val === 'number') return val;
            if (Array.isArray(val)) return val.length > 0 ? (val[0]?.count ?? val.length) : 0;
            return val.count ?? 0;
        };

        return {
            ...p,
            id: cleanId,
            profiles: authorProfile,
            original_post: mappedOriginal,
            is_quote: isQuote,
            is_repost_from_shares: isRepost,
            likes: { count: p.likes_count ?? resolveCount(p.likes) },
            comments: { count: p.comments_count ?? resolveCount(p.comments) },
            shares: { count: p.shares_count ?? resolveCount(p.shares) }
        };
    },

    // --- CONSULTAS DE POSTS ---
    getPosts: async () => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (id, full_name, avatar_url, user_type, faculty),
                likes (count),
                comments (count),
                shares (count),
                original_post:posts!original_post_id (
                    *,
                    profiles:user_id (id, full_name, avatar_url, user_type)
                )
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) return { data: null, error };

        // Fetch missing original_posts
        if (data) {
            await Promise.all(data.map(async (post) => {
                if (post.original_post_id && !post.original_post) {
                    const { data: originalPost } = await supabase
                        .from('posts')
                        .select(`*, profiles:user_id (id, full_name, avatar_url, user_type)`)
                        .eq('id', post.original_post_id)
                        .maybeSingle();
                    if (originalPost) post.original_post = originalPost;
                }
            }));
        }

        return { data: data.map(api.mapPostData), error: null };
    },

    getUserPosts: async (userId: string) => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (id, full_name, avatar_url, user_type, faculty),
                likes (count),
                comments (count),
                shares (count),
                original_post:posts!original_post_id (
                    *,
                    profiles:user_id (id, full_name, avatar_url, user_type)
                )
            `)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) return { data: null, error };

        // Fetch missing original_posts
        if (data) {
            await Promise.all(data.map(async (post) => {
                if (post.original_post_id && !post.original_post) {
                    const { data: originalPost } = await supabase
                        .from('posts')
                        .select(`*, profiles:user_id (id, full_name, avatar_url, user_type)`)
                        .eq('id', post.original_post_id)
                        .maybeSingle();
                    if (originalPost) post.original_post = originalPost;
                }
            }));
        }

        return { data: data.map(api.mapPostData), error: null };
    },

    getPost: async (postId: string) => {
        const cleanId = postId.replace('share_', '').replace('quote_', '').split('?')[0];
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (id, full_name, avatar_url, user_type, faculty),
                likes (count),
                comments (count),
                shares (count),
                original_post:posts!original_post_id (*, profiles:user_id (id, full_name, avatar_url, user_type))
            `)
            .eq('id', cleanId)
            .maybeSingle();

        if (error) return { data: null, error };
        if (!data) return { data: null, error: null };

        // Si el post tiene original_post_id pero no vino el original_post en la consulta,
        // hacemos una consulta adicional para obtenerlo
        if (data.original_post_id && !data.original_post) {
            console.warn('⚠️ original_post no vino en la consulta principal, haciendo fetch adicional...');
            const { data: originalPost, error: origError } = await supabase
                .from('posts')
                .select(`*, profiles:user_id (id, full_name, avatar_url, user_type)`)
                .eq('id', data.original_post_id)
                .maybeSingle();

            if (!origError && originalPost) {
                data.original_post = originalPost;
                console.log('✅ original_post obtenido exitosamente:', originalPost.id);
            } else {
                console.error('❌ No se pudo obtener el original_post:', origError || 'Post no encontrado');
            }
        }

        return { data: data ? api.mapPostData(data) : null, error };
    },

    getPostByCommentId: async (commentId: string) => {
        const cleanCommentId = commentId.split('?')[0].replace('share_', '').replace('quote_', '');
        const { data: comment, error } = await supabase.from('comments').select('post_id').eq('id', cleanCommentId).maybeSingle();
        if (error || !comment) return { data: null, error: error || new Error('Comment not found') };
        return api.getPost(comment.post_id);
    },

    createPost: async (content: string, userId: string, imageUrl: string | null = null, isOfficial: boolean = false, originalPostId: string | null = null) => {
        const sanitizedContent = content ? content.replace(/<[^>]*>?/gm, '').trim() : '';
        const cleanOriginalId = originalPostId ? originalPostId.toString().replace('share_', '').replace('quote_', '') : null;
        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: userId,
                content: sanitizedContent,
                image_url: imageUrl,
                is_official: isOfficial,
                original_post_id: cleanOriginalId,
                is_quote: !!cleanOriginalId
            })
            .select(`
                *,
                profiles:user_id (id, full_name, avatar_url, user_type, faculty),
                original_post:posts!original_post_id (
                    *,
                    profiles:user_id (id, full_name, avatar_url, user_type)
                )
            `)
            .single();

        if (error) return { data: null, error };

        // Si es un quote/repost y no vino el original_post, lo obtenemos
        if (data && cleanOriginalId && !data.original_post) {
            console.warn('⚠️ original_post no vino al crear quote, haciendo fetch adicional...');
            const { data: originalPost } = await supabase
                .from('posts')
                .select(`*, profiles:user_id (id, full_name, avatar_url, user_type)`)
                .eq('id', cleanOriginalId)
                .maybeSingle();
            if (originalPost) {
                data.original_post = originalPost;
                console.log('✅ original_post obtenido para nuevo quote');
            }
        }

        if (!error && cleanOriginalId) {
            await supabase.rpc('increment_shares_count', { post_id_param: cleanOriginalId });
        }
        return { data: data ? api.mapPostData(data) : null, error };
    },

    deletePost: async (postId: string) => {
        const cleanId = postId.replace('share_', '').replace('quote_', '');
        const { error } = await supabase.from('posts').delete().eq('id', cleanId);
        return { error };
    },

    softDeletePost: async (postId: string) => {
        const cleanId = postId.replace('share_', '').replace('quote_', '');
        const { data, error } = await supabase.rpc('soft_delete_post', { post_id_param: cleanId });
        return { data, error };
    },

    sharePost: async (postId: string) => {
        const cleanId = postId.replace('share_', '').replace('quote_', '');
        const { error } = await supabase.rpc('increment_shares_count', { post_id_param: cleanId });
        return { error };
    },

    // --- LIKES ---
    toggleLike: async (targetId: string, userId: string) => {
        const cleanId = targetId.replace('share_', '').replace('quote_', '');
        const { data: existingLike } = await supabase.from('likes').select('id').eq('post_id', cleanId).eq('user_id', userId).maybeSingle();
        if (existingLike) {
            const { error } = await supabase.from('likes').delete().eq('id', existingLike.id);
            return { data: { liked: false }, error };
        } else {
            const { error } = await supabase.from('likes').insert({ post_id: cleanId, user_id: userId });
            return { data: { liked: true }, error };
        }
    },

    getLikesCount: async (targetId: string) => {
        const cleanId = targetId.replace('share_', '').replace('quote_', '');
        const { count, error } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', cleanId);
        return { count, error };
    },

    checkUserLiked: async (targetId: string, userId: string) => {
        const cleanId = targetId.replace('share_', '').replace('quote_', '');
        const { data, error } = await supabase.from('likes').select('id').eq('post_id', cleanId).eq('user_id', userId).maybeSingle();
        return { liked: !!data, error };
    },

    getSharesCount: async (targetId: string) => {
        const cleanId = targetId.replace('share_', '').replace('quote_', '');
        const { count, error } = await supabase.from('shares').select('id', { count: 'exact', head: true }).eq('post_id', cleanId);
        return { count, error };
    },

    checkUserReposted: async (targetId: string, userId: string) => {
        const cleanId = targetId.replace('share_', '').replace('quote_', '');
        const { data, error } = await supabase.from('shares').select('id').eq('post_id', cleanId).eq('user_id', userId).maybeSingle();
        return { reposted: !!data, error };
    },

    toggleRepost: async (postId: string) => {
        const cleanId = postId.replace('share_', '').replace('quote_', '');
        const { data, error } = await supabase.rpc('toggle_repost', { post_id_param: cleanId });
        return { data, error };
    },

    // --- COMMENTS ---
    getComments: async (targetId: string) => {
        const cleanId = targetId.replace('share_', '').replace('quote_', '');
        const { data, error } = await supabase.from('comments').select(`*, profiles:user_id (id, full_name, avatar_url, user_type)`).eq('post_id', cleanId).order('created_at', { ascending: true });
        return { data, error };
    },

    addComment: async (targetId: string, content: string, userId: string, parentId: string | null = null) => {
        const cleanId = targetId.replace('share_', '').replace('quote_', '');
        const { data, error } = await supabase.from('comments').insert({ post_id: cleanId, user_id: userId, parent_id: parentId, content }).select(`*, profiles:user_id (id, full_name, avatar_url, user_type)`).single();
        return { data, error };
    },

    deleteComment: async (commentId: string) => {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        return { error };
    },

    // --- STORAGE ---
    uploadImage: async (file: File, bucket: 'posts' | 'avatars' = 'posts') => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
        if (uploadError) return { error: uploadError };
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return { data: publicUrl, error: null };
    },

    // --- NOTIFICATIONS ---
    getNotifications: async (userId: string) => {
        try {
            const { data: notifs, error: fetchError } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (fetchError || !notifs) return { data: notifs, error: fetchError };
            const actorIds = Array.from(new Set(notifs.map(n => n.actor_id).filter(id => !!id)));
            if (actorIds.length === 0) return { data: notifs, error: null };
            const { data: actors, error: actorsError } = await supabase.from('profiles').select('id, full_name, avatar_url, user_type').in('id', actorIds);
            if (actorsError) return { data: notifs, error: null };
            const enriched = notifs.map(n => ({ ...n, actor: actors?.find(a => a.id === n.actor_id) }));
            return { data: enriched, error: null };
        } catch (err) {
            return { data: null, error: err as any };
        }
    },

    markNotificationRead: async (notificationId: string) => {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
        return { error };
    },

    markAllNotificationsAsRead: async (userId: string) => {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
        return { error };
    },

    broadcastNotification: async (title: string, content: string, entityId?: string) => {
        const { error } = await supabase.rpc('broadcast_official_announcement', { title_param: title, content_param: content, entity_id_param: entityId });
        return { success: !error, error };
    },

    // --- FOLLOW SYSTEM ---
    followUser: async (targetId: string, currentId: string) => {
        const { error } = await supabase.from('followers').insert({ follower_id: currentId, following_id: targetId });
        return { error };
    },

    unfollowUser: async (targetId: string, currentId: string) => {
        const { error } = await supabase.from('followers').delete().match({ follower_id: currentId, following_id: targetId });
        return { error };
    },

    getFollowStatus: async (targetId: string, currentId: string) => {
        const { data, error } = await supabase.from('followers').select('*').match({ follower_id: currentId, following_id: targetId }).maybeSingle();
        return { following: !!data, error };
    },

    getFollowCounts: async (userId: string) => {
        const { count: followersCount, error: error1 } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId);
        const { count: followingCount, error: error2 } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
        return { followers: followersCount || 0, following: followingCount || 0, error: error1 || error2 };
    },

    getFollowers: async (userId: string) => {
        const { data, error } = await supabase.from('followers').select('follower_id').eq('following_id', userId);
        if (error || !data) return { data: [], error };
        const ids = data.map(f => f.follower_id);
        const { data: profiles, error: pError } = await supabase.from('profiles').select('*').in('id', ids);
        return { data: profiles, error: pError };
    },

    getFollowing: async (userId: string) => {
        const { data, error } = await supabase.from('followers').select('following_id').eq('follower_id', userId);
        if (error || !data) return { data: [], error };
        const ids = data.map(f => f.following_id);
        const { data: profiles, error: pError } = await supabase.from('profiles').select('*').in('id', ids);
        return { data: profiles, error: pError };
    },

    // --- SEARCH / EXPLORE ---
    searchUsers: async (query: string) => {
        const { data, error } = await supabase.from('profiles').select('*').or(`full_name.ilike.%${query}%,username.ilike.%${query}%`).limit(10);
        return { data, error };
    },

    getTrendingPosts: async (period: string = 'day') => {
        const { data, error } = await supabase.rpc('get_trending_posts', { period_param: period });
        return { data: (data || []).map(api.mapPostData), error };
    },

    getSmartFeed: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return api.getPosts();
        try {
            const { data: followingData } = await supabase.from('followers').select('following_id').eq('follower_id', userId);
            const followingIds = (followingData || []).map(f => f.following_id);
            followingIds.push(userId);
            const { data, error } = await supabase.from('posts').select(`*, profiles:user_id (id, full_name, avatar_url, user_type, faculty), likes (count), comments (count), shares (count), original_post:posts!original_post_id (*, profiles:user_id (id, full_name, avatar_url, user_type))`).in('user_id', followingIds).is('deleted_at', null).order('created_at', { ascending: false }).limit(50);

            // Fetch missing original_posts
            if (data) {
                await Promise.all(data.map(async (post) => {
                    if (post.original_post_id && !post.original_post) {
                        const { data: originalPost } = await supabase
                            .from('posts')
                            .select(`*, profiles:user_id (id, full_name, avatar_url, user_type)`)
                            .eq('id', post.original_post_id)
                            .maybeSingle();
                        if (originalPost) post.original_post = originalPost;
                    }
                }));
            }

            return { data: (data || []).map(api.mapPostData), error };
        } catch (err) {
            return api.getPosts();
        }
    },

    // --- STORIES ---
    getStories: async () => {
        const now = new Date().toISOString();
        const { data, error } = await supabase.from('stories').select(`*, profiles:user_id (id, full_name, avatar_url)`).gt('expires_at', now).order('created_at', { ascending: false });
        return { data, error };
    },

    createStory: async (userId: string, imageUrl: string | null, content?: string, background?: string) => {
        const { data, error } = await supabase.from('stories').insert({ user_id: userId, image_url: imageUrl, content, background }).select().single();
        return { data, error };
    },

    deleteStory: async (storyId: string, userId: string) => {
        const { error } = await supabase.from('stories').delete().eq('id', storyId).eq('user_id', userId);
        return { error };
    },

    // --- ADMIN / STATS ---
    getOfficialPosts: async () => {
        const { data, error } = await supabase.from('posts').select(`*, profiles:user_id (id, full_name, avatar_url, user_type, faculty), likes (count), comments (count), shares (count), original_post:posts!original_post_id (count)`).eq('is_official', true).order('created_at', { ascending: false });
        return { data, error };
    },

    getSystemStats: async () => {
        try {
            const { data, error } = await supabase.rpc('get_system_stats');
            if (error) throw error;
            if (data) return {
                usersCount: data.users_count || 0,
                postsCount: data.posts_count || 0,
                commentsCount: data.comments_count || 0,
                error: null
            };

            // Fallback manual counts if RPC returns empty or fails
            const [profiles, posts, comments] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('posts').select('id', { count: 'exact', head: true }).is('deleted_at', null),
                supabase.from('comments').select('id', { count: 'exact', head: true })
            ]);

            return {
                usersCount: profiles.count || 0,
                postsCount: posts.count || 0,
                commentsCount: comments.count || 0,
                error: null
            };
        } catch (error: any) {
            console.error('getSystemStats error:', error);
            return { usersCount: 0, postsCount: 0, commentsCount: 0, error };
        }
    },

    getAdminLogs: async (limit: number = 20) => {
        const { data, error } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(limit);
        return { data, error };
    },

    getProfileShares: async (userId: string) => {
        const { data, error } = await supabase.rpc('get_profile_shares', { user_id_param: userId });
        return { data: (data || []).map(api.mapPostData), error };
    },

    schedulePost: async (userId: string, content: string, date: string, isOfficial: boolean = false) => {
        const { data, error } = await supabase.from('scheduled_posts').insert({ user_id: userId, content, scheduled_for: date, is_official: isOfficial, status: 'pending' }).select().single();
        return { data, error };
    },

    getScheduledPosts: async (userId: string) => {
        const { data, error } = await supabase.from('scheduled_posts').select('*').eq('user_id', userId).order('scheduled_for', { ascending: true });
        return { data, error };
    },

    deleteScheduledPost: async (id: string) => {
        const { error } = await supabase.from('scheduled_posts').delete().eq('id', id);
        return { error };
    },

    // --- SETTINGS ---
    getSettings: async (userId: string) => {
        const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
        return { data, error };
    },

    updateSettings: async (userId: string, settings: any) => {
        const { data, error } = await supabase.from('user_settings').upsert({ user_id: userId, ...settings }).select().single();
        return { data, error };
    },

    deleteUserAccount: async () => {
        const { error } = await supabase.rpc('delete_user_account');
        return { error };
    }
};
