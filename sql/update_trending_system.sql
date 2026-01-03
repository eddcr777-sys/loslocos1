-- =================================================================
-- TRENDING ALGORITHM UPDATE (v2.1 - Schema Reset & Safety)
-- =================================================================

-- 1. Forzar recreación para aplicar nuevo esquema (content_id, content_type)
DROP TABLE IF EXISTS public.trending_posts;

CREATE TABLE public.trending_posts (
    content_id UUID PRIMARY KEY,
    content_type TEXT NOT NULL,
    score FLOAT DEFAULT 0,
    period TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Habilitar seguridad
ALTER TABLE public.trending_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Trending" ON public.trending_posts FOR SELECT USING (true);

-- 2. Función para actualizar tendencias con pesos corregidos (Posts + Quotes)
CREATE OR REPLACE FUNCTION public.update_trending_posts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.trending_posts;

    -- TENDENCIAS DE POSTS
    INSERT INTO public.trending_posts (content_id, content_type, score, period)
    SELECT 
        p.id,
        'post' as content_type,
        (
            (COALESCE(l.count, 0) * 1.0) +
            (COALESCE(c.count, 0) * 2.0) +
            (COALESCE(s.count, 0) * 3.0) +
            (COALESCE(q.count, 0) * 4.0)
        ) as score,
        'day' as period
    FROM public.posts p
    LEFT JOIN (SELECT post_id, count(*) FROM public.likes GROUP BY post_id) l ON l.post_id = p.id
    LEFT JOIN (SELECT post_id, count(*) FROM public.comments GROUP BY post_id) c ON c.post_id = p.id
    LEFT JOIN (SELECT post_id, count(*) FROM public.shares GROUP BY post_id) s ON s.post_id = p.id
    LEFT JOIN (SELECT original_post_id, count(*) FROM public.quotes GROUP BY original_post_id) q ON q.original_post_id = p.id
    WHERE p.deleted_at IS NULL AND p.created_at >= NOW() - INTERVAL '180 days';

    -- TENDENCIAS DE QUOTES (Nuevas)
    INSERT INTO public.trending_posts (content_id, content_type, score, period)
    SELECT 
        q.id,
        'quote' as content_type,
        (
            (COALESCE(l.count, 0) * 1.0) +
            (COALESCE(c.count, 0) * 2.0)
        ) as score,
        'day' as period
    FROM public.quotes q
    LEFT JOIN (SELECT post_id, count(*) FROM public.likes GROUP BY post_id) l ON l.post_id = q.id
    LEFT JOIN (SELECT post_id, count(*) FROM public.comments GROUP BY post_id) c ON c.post_id = q.id
    WHERE q.created_at >= NOW() - INTERVAL '180 days'
    ON CONFLICT (content_id) DO UPDATE SET score = EXCLUDED.score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para obtener tendencias con hidratación de datos
-- (Sin cambios, solo asegurar grants)
CREATE OR REPLACE FUNCTION public.get_trending_posts(period_param TEXT DEFAULT 'day')
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
    score FLOAT,
    author_data JSONB,
    item_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH trending_items AS (
        SELECT tp.content_id, tp.content_type, tp.score
        FROM public.trending_posts tp
        WHERE tp.period = period_param
    )
    SELECT 
        p.id, p.user_id, p.content, p.image_url, p.created_at,
        (SELECT count(*) FROM likes WHERE post_id = p.id)::BIGINT,
        (SELECT count(*) FROM comments WHERE post_id = p.id)::BIGINT,
        (SELECT count(*) FROM shares WHERE post_id = p.id)::BIGINT,
        (SELECT count(*) FROM quotes WHERE original_post_id = p.id)::BIGINT,
        p.is_official,
        ti.score,
        jsonb_build_object('id', prof.id, 'full_name', prof.full_name, 'avatar_url', prof.avatar_url, 'user_type', prof.user_type, 'username', prof.username, 'faculty', prof.faculty),
        'post'::TEXT
    FROM trending_items ti
    JOIN public.posts p ON p.id = ti.content_id
    JOIN public.profiles prof ON prof.id = p.user_id
    WHERE ti.content_type = 'post'

    UNION ALL

    SELECT 
        q.id, q.user_id, q.content, NULL as image_url, q.created_at,
        (SELECT count(*) FROM likes WHERE post_id = q.id)::BIGINT,
        (SELECT count(*) FROM comments WHERE post_id = q.id)::BIGINT,
        0::BIGINT, 0::BIGINT,
        q.is_official,
        ti.score,
        jsonb_build_object('id', prof.id, 'full_name', prof.full_name, 'avatar_url', prof.avatar_url, 'user_type', prof.user_type, 'username', prof.username, 'faculty', prof.faculty),
        'quote'::TEXT
    FROM trending_items ti
    JOIN public.quotes q ON q.id = ti.content_id
    JOIN public.profiles prof ON prof.id = q.user_id
    WHERE ti.content_type = 'quote'
    
    ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANTS EXPLICITOS
GRANT EXECUTE ON FUNCTION public.update_trending_posts() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_trending_posts(TEXT) TO authenticated, anon;
GRANT ALL ON TABLE public.trending_posts TO authenticated, anon, service_role;
