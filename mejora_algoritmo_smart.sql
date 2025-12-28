-- ============================================================================
-- MEJORA DEL ALGORITMO DE DISTRIBUCIÓN (QUINES CORRESPONDAN MÁS)
-- ============================================================================

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
        -- A) POSTS ORIGINALES Y CITAS
        SELECT 
            p.id, p.user_id, p.content, p.image_url, p.created_at, p.is_official,
            COALESCE(p.is_quote, FALSE) as is_quote, FALSE as is_repost, p.original_post_id, p.deleted_at,
            to_jsonb(pr) as author_data,
            (SELECT count(*) FROM public.likes WHERE post_id = p.id) as l_count,
            (SELECT count(*) FROM public.comments WHERE post_id = p.id) as c_count,
            (SELECT count(*) FROM public.shares WHERE post_id = p.id) as s_count,
            CASE WHEN op.id IS NOT NULL THEN jsonb_build_object('id', op.id, 'content', op.content, 'image_url', op.image_url, 'created_at', op.created_at, 'deleted_at', op.deleted_at, 'profiles', to_jsonb(opr)) ELSE NULL END as original_post_data,
            (
                -- Prioridad por Facultad
                CASE WHEN pr.faculty = my_faculty AND my_faculty IS NOT NULL THEN 60.0 ELSE 0.0 END +
                -- Prioridad por Seguimiento
                CASE WHEN EXISTS(SELECT 1 FROM public.followers WHERE follower_id = my_user_id AND following_id = p.user_id) THEN 40.0 ELSE 0.0 END +
                -- Factor de frescura
                CASE 
                    WHEN p.created_at > now() - INTERVAL '2 hours' THEN 50.0
                    WHEN p.created_at > now() - INTERVAL '6 hours' THEN 30.0
                    WHEN p.created_at > now() - INTERVAL '24 hours' THEN 10.0
                    ELSE 0.0
                END +
                -- Calidad del post
                ((SELECT count(*) FROM public.likes WHERE post_id = p.id) * 0.5)
            ) as score,
            EXISTS(SELECT 1 FROM public.trending_posts WHERE post_id = p.id) as is_t,
            (SELECT period FROM public.trending_posts WHERE post_id = p.id ORDER BY score DESC LIMIT 1) as t_p,
            NULL::JSONB as r_data
        FROM public.posts p 
        JOIN public.profiles pr ON p.user_id = pr.id
        LEFT JOIN public.posts op ON p.original_post_id = op.id 
        LEFT JOIN public.profiles opr ON op.user_id = opr.id
        WHERE p.deleted_at IS NULL 
          AND NOT EXISTS (SELECT 1 FROM public.shares WHERE post_id = p.id)
        
        UNION ALL
        
        -- B) REPOSTS AGRUPADOS (AQUÍ ESTÁ LA MEJORA PRINCIPAL)
        SELECT 
            p.id,
            (array_agg(s.user_id ORDER BY s.created_at DESC))[1] as user_id,
            NULL::TEXT as content, p.image_url, MAX(s.created_at) as created_at,
            p.is_official, FALSE as is_quote, TRUE as is_repost, p.id as original_post_id, p.deleted_at,
            to_jsonb((array_agg(spr ORDER BY s.created_at DESC))[1]) as author_data,
            (SELECT count(*) FROM public.likes WHERE post_id = p.id),
            (SELECT count(*) FROM public.comments WHERE post_id = p.id),
            (SELECT count(*) FROM public.shares WHERE post_id = p.id),
            jsonb_build_object('id', p.id, 'content', p.content, 'image_url', p.image_url, 'created_at', p.created_at, 'deleted_at', p.deleted_at, 'profiles', to_jsonb(ppr)) as original_post_data,
            (
                -- 1. AFINIDAD DE FACULTAD: Si un compañero de facultad lo compartió (+70)
                MAX(CASE WHEN spr.faculty = my_faculty AND my_faculty IS NOT NULL THEN 70.0 ELSE 0.0 END) +
                
                -- 2. AFINIDAD DE SEGUIDO: Si alguien que sigues lo compartió (+50)
                MAX(CASE WHEN EXISTS(SELECT 1 FROM public.followers WHERE follower_id = my_user_id AND following_id = s.user_id) THEN 50.0 ELSE 0.0 END) +
                
                -- 3. VIRALIDAD LOCAL: Bonus por cada persona que lo comparte (+15 por persona)
                (COUNT(DISTINCT s.id) * 15.0) +
                
                -- 4. RELEVANCIA TEMPORAL: Los compartidos nuevos valen mucho más
                CASE 
                    WHEN MAX(s.created_at) > now() - INTERVAL '1 hour' THEN 60.0
                    WHEN MAX(s.created_at) > now() - INTERVAL '4 hours' THEN 40.0
                    WHEN MAX(s.created_at) > now() - INTERVAL '12 hours' THEN 20.0
                    ELSE 5.0
                END +
                
                -- 5. POPULARIDAD ORIGINAL: Si el post de origen tiene muchos likes
                ((SELECT count(*) FROM public.likes WHERE post_id = p.id) * 0.2)
            ) as score,
            EXISTS(SELECT 1 FROM public.trending_posts WHERE post_id = p.id),
            (SELECT period FROM public.trending_posts WHERE post_id = p.id ORDER BY score DESC LIMIT 1),
            jsonb_agg(
                jsonb_build_object(
                    'user_id', s.user_id,
                    'full_name', spr.full_name,
                    'avatar_url', spr.avatar_url,
                    'faculty', spr.faculty,
                    'created_at', s.created_at
                ) ORDER BY s.created_at DESC
            ) as r_data
        FROM public.shares s
        JOIN public.posts p ON s.post_id = p.id
        JOIN public.profiles spr ON s.user_id = spr.id
        JOIN public.profiles ppr ON p.user_id = ppr.id
        WHERE p.deleted_at IS NULL
        GROUP BY p.id, p.image_url, p.is_official, p.content, p.created_at, ppr.id, p.deleted_at
    )
    SELECT * FROM feed_items 
    ORDER BY 
        is_official DESC,    -- Anuncios oficiales siempre arriba
        is_trending DESC,    -- Viral nacional segundo
        relevance_score DESC, -- El nuevo cálculo inteligente tercero
        created_at DESC        -- Fecha último recurso
    LIMIT 100;
END;
$$;
