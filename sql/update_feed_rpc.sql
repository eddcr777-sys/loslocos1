-- =================================================================
-- UPDATE: get_complete_feed TO INCLUDE QUOTES
-- =================================================================

-- DROP FIRST because return type changed
DROP FUNCTION IF EXISTS public.get_complete_feed();

CREATE OR REPLACE FUNCTION public.get_complete_feed()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    likes_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT,
    quotes_count BIGINT,
    is_official BOOLEAN,
    deleted_at TIMESTAMPTZ,
    item_type TEXT, -- 'post', 'share', 'quote'
    original_post_id UUID,
    share_id UUID,
    reposter_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    
    -- 1. REGULAR POSTS
    SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        (SELECT count(*) FROM likes WHERE post_id = p.id)::BIGINT as likes_count,
        (SELECT count(*) FROM comments WHERE post_id = p.id)::BIGINT as comments_count,
        (SELECT count(*) FROM shares WHERE post_id = p.id)::BIGINT as shares_count,
        (SELECT count(*) FROM quotes WHERE original_post_id = p.id)::BIGINT as quotes_count,
        p.is_official,
        p.deleted_at,
        'post'::TEXT as item_type,
        NULL::UUID as original_post_id,
        NULL::UUID as share_id,
        NULL::UUID as reposter_id
    FROM posts p
    WHERE p.deleted_at IS NULL AND p.original_post_id IS NULL -- Exclude old quotes if any remain

    UNION ALL

    -- 2. SHARES (Reposts)
    SELECT 
        s.id as id, -- Unique Share ID
        s.user_id as user_id, -- Person who shared it
        '' as content,
        NULL as image_url,
        s.created_at, 
        0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 
        false,
        NULL,
        'share'::TEXT as item_type,
        s.post_id as original_post_id,
        s.id as share_id,
        s.user_id as reposter_id 
    FROM shares s

    UNION ALL

    -- 3. QUOTES (New Table)
    SELECT 
        q.id,
        q.user_id, -- Person who quoted it
        q.content,
        NULL as image_url,
        q.created_at,
        0::BIGINT as likes_count, 
        0::BIGINT as comments_count,
        0::BIGINT as shares_count,
        0::BIGINT as quotes_count,
        q.is_official,
        NULL as deleted_at,
        'quote'::TEXT as item_type,
        q.original_post_id,
        NULL::UUID as share_id,
        NULL::UUID as reposter_id
    FROM quotes q
    
    ORDER BY created_at DESC
    LIMIT 100;
END;
$$;
