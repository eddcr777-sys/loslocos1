-- ============================================================================
-- SQL DEFINITIVO: SISTEMA DE COMPARTIDOS Y ALGORITMO INTELIGENTE
-- EJECUTAR TODO ESTO EN EL SQL EDITOR DE SUPABASE
-- ============================================================================

-- 1. ASEGURAR TABLAS
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) DEFAULT auth.uid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.trending_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('day', 'week', 'month', 'year')),
    score DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(post_id, period)
);

-- 2. FUNCIÓN PARA COMPARTIDOS DEL PERFIL (MODIFICADA PARA SER ROBUSTA)
DROP FUNCTION IF EXISTS public.get_profile_shares(UUID);
CREATE OR REPLACE FUNCTION public.get_profile_shares(user_id_param UUID)
RETURNS TABLE (
    type TEXT,
    id UUID,
    user_id UUID,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    original_post_id UUID,
    original_post_data JSONB,
    author_data JSONB,
    is_official BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Parte 1: Reposts (desde tabla shares)
    SELECT 
        'repost'::TEXT as type,
        p.id,
        s.user_id, -- El usuario que hizo el repost
        NULL::TEXT as content,
        p.image_url,
        s.created_at as created_at,
        p.id as original_post_id,
        jsonb_build_object(
            'id', p.id,
            'content', p.content,
            'image_url', p.image_url,
            'created_at', p.created_at,
            'deleted_at', p.deleted_at,
            'profiles', to_jsonb(ppr) -- Autor original
        ) as original_post_data,
        to_jsonb(pr) as author_data, -- Perfil de quien compartió
        p.is_official
    FROM public.shares s
    JOIN public.posts p ON s.post_id = p.id
    JOIN public.profiles pr ON s.user_id = pr.id  -- Quien compartió
    LEFT JOIN public.profiles ppr ON p.user_id = ppr.id -- Autor original
    WHERE s.user_id = user_id_param
    
    UNION ALL
    
    -- Parte 2: Quotes (desde tabla posts con original_post_id)
    SELECT 
        'quote'::TEXT as type,
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        p.original_post_id,
        CASE 
            WHEN op.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', op.id,
                    'content', op.content,
                    'image_url', op.image_url,
                    'created_at', op.created_at,
                    'deleted_at', op.deleted_at,
                    'profiles', to_jsonb(opr)
                )
            ELSE NULL
        END as original_post_data,
        to_jsonb(pr) as author_data,
        p.is_official
    FROM public.posts p
    JOIN public.profiles pr ON p.user_id = pr.id
    LEFT JOIN public.posts op ON p.original_post_id = op.id
    LEFT JOIN public.profiles opr ON op.user_id = opr.id
    WHERE p.user_id = user_id_param 
      AND p.original_post_id IS NOT NULL 
      AND p.deleted_at IS NULL
      
    ORDER BY created_at DESC;
END;
$$;

-- 3. FUNCIÓN PARA SMART FEED (CON AGRUPAMIENTO CORREGIDO)
DROP FUNCTION IF EXISTS public.get_smart_feed();
CREATE OR REPLACE FUNCTION public.get_smart_feed()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    is_official BOOLEAN,
    is_quote BOOLEAN,
    is_repost BOOLEAN,
    original_post_id UUID,
    deleted_at TIMESTAMPTZ,
    author_data JSONB,
    likes_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT,
    original_post_data JSONB,
    relevance_score DECIMAL(10,2),
    is_trending BOOLEAN,
    trending_period TEXT,
    reposters_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    my_faculty TEXT;
    my_user_id UUID;
BEGIN
    my_user_id := auth.uid();
    SELECT faculty INTO my_faculty FROM public.profiles WHERE id = my_user_id;

    RETURN QUERY
    WITH feed_items AS (
        -- A) Posts normales y quotes directas
        SELECT 
            p.id,
            p.user_id,
            p.content,
            p.image_url,
            p.created_at,
            p.is_official,
            COALESCE(p.is_quote, FALSE) as is_quote,
            FALSE as is_repost,
            p.original_post_id,
            p.deleted_at,
            to_jsonb(pr) as author_data,
            (SELECT count(*) FROM public.likes WHERE post_id = p.id) as likes_count,
            (SELECT count(*) FROM public.comments WHERE post_id = p.id) as comments_count,
            (SELECT count(*) FROM public.shares WHERE post_id = p.id) as shares_count,
            CASE 
                WHEN op.id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', op.id,
                        'content', op.content,
                        'image_url', op.image_url,
                        'created_at', op.created_at,
                        'deleted_at', op.deleted_at,
                        'profiles', to_jsonb(opr)
                    )
                ELSE NULL
            END as original_post_data,
            (
                CASE WHEN pr.faculty = my_faculty AND my_faculty IS NOT NULL THEN 50.0 ELSE 0.0 END +
                CASE WHEN EXISTS(SELECT 1 FROM public.followers WHERE follower_id = my_user_id AND following_id = p.user_id) THEN 30.0 ELSE 0.0 END +
                CASE WHEN p.created_at > now() - INTERVAL '6 hours' THEN 40.0 ELSE 10.0 END
            ) as relevance_score,
            EXISTS(SELECT 1 FROM public.trending_posts WHERE post_id = p.id) as is_trending,
            (SELECT period FROM public.trending_posts WHERE post_id = p.id ORDER BY score DESC LIMIT 1) as trending_period,
            NULL::JSONB as reposters_data
        FROM public.posts p
        JOIN public.profiles pr ON p.user_id = pr.id
        LEFT JOIN public.posts op ON p.original_post_id = op.id
        LEFT JOIN public.profiles opr ON op.user_id = opr.id
        WHERE p.deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM public.shares WHERE post_id = p.id) -- Evitar duplicados si ya se agrupan
        
        UNION ALL
        
        -- B) Posts agrupados por Reposts
        SELECT 
            p.id,
            (array_agg(s.user_id ORDER BY s.created_at DESC))[1] as user_id,
            NULL::TEXT as content,
            p.image_url,
            MAX(s.created_at) as created_at,
            p.is_official,
            FALSE as is_quote,
            TRUE as is_repost,
            p.id as original_post_id,
            p.deleted_at,
            to_jsonb((array_agg(spr ORDER BY s.created_at DESC))[1]) as author_data, -- El último que compartió
            (SELECT count(*) FROM public.likes WHERE post_id = p.id) as likes_count,
            (SELECT count(*) FROM public.comments WHERE post_id = p.id) as comments_count,
            (SELECT count(*) FROM public.shares WHERE post_id = p.id) as shares_count,
            jsonb_build_object(
                'id', p.id,
                'content', p.content,
                'image_url', p.image_url,
                'created_at', p.created_at,
                'deleted_at', p.deleted_at,
                'profiles', to_jsonb(ppr)
            ) as original_post_data,
            (
                MAX(CASE WHEN spr.faculty = my_faculty AND my_faculty IS NOT NULL THEN 50.0 ELSE 0.0 END) +
                (COUNT(DISTINCT s.id) * 10.0) +
                50.0 -- Bonus base por ser compartido
            ) as relevance_score,
            EXISTS(SELECT 1 FROM public.trending_posts WHERE post_id = p.id) as is_trending,
            (SELECT period FROM public.trending_posts WHERE post_id = p.id ORDER BY score DESC LIMIT 1) as trending_period,
            jsonb_agg(
                jsonb_build_object(
                    'user_id', s.user_id,
                    'full_name', spr.full_name,
                    'avatar_url', spr.avatar_url,
                    'faculty', spr.faculty,
                    'created_at', s.created_at
                ) ORDER BY s.created_at DESC
            ) as reposters_data
        FROM public.shares s
        JOIN public.posts p ON s.post_id = p.id
        JOIN public.profiles spr ON s.user_id = spr.id
        JOIN public.profiles ppr ON p.user_id = ppr.id
        WHERE p.deleted_at IS NULL
        GROUP BY p.id, p.image_url, p.is_official, p.created_at, ppr.id, p.deleted_at
    )
    SELECT * FROM feed_items
    ORDER BY is_trending DESC, relevance_score DESC, created_at DESC
    LIMIT 100;
END;
$$;
