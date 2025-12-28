-- Enable RLS on all tables implicated if not already
-- (Assuming profiles, posts already enabled)

-- 1. Create SHARES table
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Ensure post_id exists if table was created partially
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own shares" ON public.shares;
CREATE POLICY "Users can insert their own shares" ON public.shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own shares" ON public.shares;
CREATE POLICY "Users can delete their own shares" ON public.shares
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view shares" ON public.shares;
CREATE POLICY "Anyone can view shares" ON public.shares
    FOR SELECT USING (true);


-- 2. Update NOTIFICATIONS table (or create if partial)
-- Checking if it exists first to be safe, but usually we just alter if needed.
-- We assume a 'notifications' table exists from previous context, but we need specific columns.
-- If it doesn't exist, we create it. If it does, we add columns.

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    entity_id UUID,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    group_count INTEGER DEFAULT 1,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Remove old type check constraint if it exists
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint allowing the required notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('repost', 'quote', 'like', 'official', 'follow', 'comment', 'reply'));


-- Drop existing check constraint if it exists to allow new types ('repost', 'quote')
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Ensure columns exist if table was already there (IF NOT EXISTS above won't add them)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS group_count INTEGER DEFAULT 1;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Ensure RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Modify POSTS table for Soft Delete
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. RPC: Toggle Repost
CREATE OR REPLACE FUNCTION toggle_repost(post_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM public.shares
    WHERE user_id = auth.uid() AND post_id = post_id_param;

    IF existing_id IS NOT NULL THEN
        DELETE FROM public.shares WHERE id = existing_id;
        RETURN FALSE; -- Removed
    ELSE
        INSERT INTO public.shares (user_id, post_id)
        VALUES (auth.uid(), post_id_param);
        RETURN TRUE; -- Added
    END IF;
END;
$$;


-- 5. RPC: Soft Delete Post
CREATE OR REPLACE FUNCTION soft_delete_post(post_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify ownership
    IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = post_id_param AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    UPDATE public.posts
    SET deleted_at = now()
    WHERE id = post_id_param;

    RETURN TRUE;
END;
$$;


-- 6. TRIGGER FUNCTION: Smart Batching for Reposts
CREATE OR REPLACE FUNCTION handle_new_share()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner_id UUID;
    existing_notif_id UUID;
    target_post_id UUID;
BEGIN
    target_post_id := NEW.post_id;
    
    -- Get post owner
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = target_post_id;

    -- Rule of Silence: Don't notify if self-repost
    IF post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Smart Batching: Check for unread notification of type 'repost' for this post
    SELECT id INTO existing_notif_id 
    FROM public.notifications
    WHERE user_id = post_owner_id
      AND post_id = target_post_id
      AND type = 'repost'
      AND read = false;

    IF existing_notif_id IS NOT NULL THEN
        -- Update existing
        UPDATE public.notifications
        SET group_count = group_count + 1,
            actor_id = NEW.user_id, -- Update to latest actor
            created_at = now()      -- Bump to top
        WHERE id = existing_notif_id;
    ELSE
        -- Create new
        INSERT INTO public.notifications (
            user_id,
            actor_id,
            type,
            post_id,
            group_count,
            read
        ) VALUES (
            post_owner_id,
            NEW.user_id,
            'repost',
            target_post_id,
            1,
            false
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 7. TRIGGER: On Share Insert
DROP TRIGGER IF EXISTS on_share_created ON public.shares;
CREATE TRIGGER on_share_created
    AFTER INSERT ON public.shares
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_share();


-- 8. TRIGGER FUNCTION: Notification for Quotes
CREATE OR REPLACE FUNCTION handle_new_quote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    original_owner_id UUID;
    existing_notif_id UUID;
BEGIN
    -- Only proceed if it is a quote (has original_post_id AND content)
    IF NEW.original_post_id IS NULL OR NEW.content IS NULL OR NEW.content = '' THEN
        RETURN NEW;
    END IF;

    -- Get original post owner
    SELECT user_id INTO original_owner_id FROM public.posts WHERE id = NEW.original_post_id;

    -- Rule of Silence
    IF original_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Smart Batching for Quotes? 
    -- User prompt specific Logic: "Para quote: [User_Name] citó tu publicación"
    -- Usually quotes are distinct conversations, so we might NOT want to batch them strictly like simple reposts, 
    -- OR we batch them if unread. Let's apply batching for consistency if unread.
    
    SELECT id INTO existing_notif_id
    FROM public.notifications
    WHERE user_id = original_owner_id
      AND post_id = NEW.original_post_id
      AND type = 'quote'
      AND read = false;

    IF existing_notif_id IS NOT NULL THEN
        UPDATE public.notifications
        SET group_count = group_count + 1,
            actor_id = NEW.user_id,
            created_at = now()
        WHERE id = existing_notif_id;
    ELSE
         INSERT INTO public.notifications (
            user_id,
            actor_id,
            type,
            post_id, -- Linking to the ORIGINAL post being quoted
            entity_id, -- Linking to the specific NEW quote post
            group_count,
            read
        ) VALUES (
            original_owner_id,
            NEW.user_id,
            'quote',
            NEW.original_post_id,
            NEW.id, 
            1,
            false
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 9. TRIGGER: On Post Insert (for Quotes)
DROP TRIGGER IF EXISTS on_quote_created ON public.posts;
CREATE TRIGGER on_quote_created
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_quote();

-- 10. RPC: Get Profile Shares (Mixed Reposts & Quotes)
DROP FUNCTION IF EXISTS get_profile_shares(UUID);
CREATE OR REPLACE FUNCTION get_profile_shares(user_id_param UUID)
RETURNS TABLE (
    type TEXT,
    id UUID,
    user_id UUID,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    original_post_id UUID,
    original_post_data JSONB, -- Simplified joined data
    author_data JSONB -- Who shared/quoted (the profile owner)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    
    -- 1. Reposts (from shares table)
    SELECT 
        'repost'::TEXT as type,
        s.id, -- share id
        s.user_id,
        NULL::TEXT as content,
        NULL::TEXT as image_url,
        s.created_at,
        s.post_id as original_post_id,
        to_jsonb(p) as original_post_data,
        to_jsonb(pr) as author_data
    FROM public.shares s
    JOIN public.posts p ON s.post_id = p.id
    JOIN public.profiles pr ON s.user_id = pr.id
    WHERE s.user_id = user_id_param
    
    UNION ALL
    
    -- 2. Quotes (from posts table)
    SELECT 
        'quote'::TEXT as type,
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        p.original_post_id,
        to_jsonb(op) as original_post_data,
        to_jsonb(pr) as author_data
    FROM public.posts p
    LEFT JOIN public.posts op ON p.original_post_id = op.id
    JOIN public.profiles pr ON p.user_id = pr.id
    WHERE p.user_id = user_id_param
      AND p.original_post_id IS NOT NULL
      
    ORDER BY created_at DESC;
END;
$$;

-- 11. RPC: Get Feed with Faculty Priority
DROP FUNCTION IF EXISTS get_priority_feed();
CREATE OR REPLACE FUNCTION get_priority_feed()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    is_official BOOLEAN,
    original_post_id UUID,
    deleted_at TIMESTAMPTZ,
    author_faculty TEXT,
    author_data JSONB,
    likes_count BIGINT,
    comments_count BIGINT,
    original_post_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    my_faculty TEXT;
BEGIN
    -- Get current user faculty
    SELECT faculty INTO my_faculty FROM public.profiles WHERE id = auth.uid();

    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        p.is_official,
        p.original_post_id,
        p.deleted_at,
        pr.faculty as author_faculty,
        to_jsonb(pr) as author_data,
        (SELECT count(*) FROM public.likes WHERE post_id = p.id) as likes_count,
        (SELECT count(*) FROM public.comments WHERE post_id = p.id) as comments_count,
        CASE 
            WHEN op.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', op.id,
                    'content', op.content,
                    'image_url', op.image_url,
                    'created_at', op.created_at,
                    'profiles', to_jsonb(opr)
                )
            ELSE NULL
        END as original_post_data
    FROM public.posts p
    JOIN public.profiles pr ON p.user_id = pr.id
    LEFT JOIN public.posts op ON p.original_post_id = op.id
    LEFT JOIN public.profiles opr ON op.user_id = opr.id
    WHERE p.deleted_at IS NULL
    ORDER BY 
        (pr.faculty IS NOT DISTINCT FROM my_faculty AND my_faculty IS NOT NULL) DESC,
        p.created_at DESC
    LIMIT 50;
END;
$$;
