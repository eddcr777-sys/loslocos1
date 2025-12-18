import { supabase } from '../utils/supabaseClient';

export interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    bio: string;
}

export interface Post {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    profiles: Profile; // Joined data
    likes: { count: number }; // Joined data
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

    // --- POSTS ---
    getPosts: async () => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        profiles (id, full_name, avatar_url),
        likes (count)
      `)
            .order('created_at', { ascending: false });

        // Mapper to clean up structure if needed, but returning raw for now
        return { data, error };
    },

    getUserPosts: async (userId: string) => {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        profiles (id, full_name, avatar_url),
        likes (count)
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
        profiles (id, full_name, avatar_url)
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
        profiles (id, full_name, avatar_url)
      `)
            .single();
        return { data, error };
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
    }
};
