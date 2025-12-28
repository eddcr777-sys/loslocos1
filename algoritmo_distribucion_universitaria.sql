-- ============================================================================
-- ALGORITMO AVANZADO DE DISTRIBUCIÓN UNIVERSITARIA
-- Sistema de Scoring Inteligente con Relevancia Académica
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE TRENDING (Para Viralidad Cross-Facultad)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trending_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('day', 'week', 'month', 'year')),
    score DECIMAL(10,2) DEFAULT 0,
    cross_faculty_count INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(post_id, period)
);

CREATE INDEX IF NOT EXISTS idx_trending_period_score ON public.trending_posts(period, score DESC);

-- ============================================================================
-- 2. FUNCIÓN: CALCULAR SCORE DE VIRALIDAD
-- ============================================================================

DROP FUNCTION IF EXISTS calculate_viral_score(UUID);
CREATE OR REPLACE FUNCTION calculate_viral_score(post_id_param UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_likes INTEGER;
    total_shares INTEGER;
    total_comments INTEGER;
    faculty_diversity INTEGER;
    viral_score DECIMAL(10,2);
BEGIN
    -- Contar interacciones
    SELECT count(*) INTO total_likes FROM public.likes WHERE post_id = post_id_param;
    SELECT count(*) INTO total_shares FROM public.shares WHERE post_id = post_id_param;
    SELECT count(*) INTO total_comments FROM public.comments WHERE post_id = post_id_param;
    
    -- Contar cuántas facultades diferentes han interactuado
    SELECT count(DISTINCT pr.faculty) INTO faculty_diversity
    FROM (
        SELECT user_id FROM public.likes WHERE post_id = post_id_param
        UNION
        SELECT user_id FROM public.shares WHERE post_id = post_id_param
        UNION
        SELECT user_id FROM public.comments WHERE post_id = post_id_param
    ) interactions
    JOIN public.profiles pr ON interactions.user_id = pr.id
    WHERE pr.faculty IS NOT NULL;
    
    -- Fórmula de scoring viral
    viral_score := (total_likes * 1.0) + (total_shares * 3.0) + (total_comments * 2.0) + (faculty_diversity * 10.0);
    
    RETURN viral_score;
END;
$$;

-- ============================================================================
-- 3. FUNCIÓN: ACTUALIZAR TRENDING POSTS
-- ============================================================================

DROP FUNCTION IF EXISTS update_trending_posts();
CREATE OR REPLACE FUNCTION update_trending_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    viral_score DECIMAL(10,2);
BEGIN
    -- Limpiar trending antiguos
    DELETE FROM public.trending_posts WHERE updated_at < now() - INTERVAL '1 year';
    
    -- Actualizar trending para posts con actividad reciente
    FOR post_record IN 
        SELECT DISTINCT p.id, p.created_at
        FROM public.posts p
        WHERE p.deleted_at IS NULL
          AND p.created_at > now() - INTERVAL '1 year'
    LOOP
        viral_score := calculate_viral_score(post_record.id);
        
        -- Solo agregar si tiene score significativo
        IF viral_score >= 10 THEN
            -- Trending del día
            IF post_record.created_at > now() - INTERVAL '1 day' THEN
                INSERT INTO public.trending_posts (post_id, period, score, updated_at)
                VALUES (post_record.id, 'day', viral_score, now())
                ON CONFLICT (post_id, period) 
                DO UPDATE SET score = viral_score, updated_at = now();
            END IF;
            
            -- Trending de la semana
            IF post_record.created_at > now() - INTERVAL '1 week' THEN
                INSERT INTO public.trending_posts (post_id, period, score, updated_at)
                VALUES (post_record.id, 'week', viral_score, now())
                ON CONFLICT (post_id, period) 
                DO UPDATE SET score = viral_score, updated_at = now();
            END IF;
            
            -- Trending del mes
            IF post_record.created_at > now() - INTERVAL '1 month' THEN
                INSERT INTO public.trending_posts (post_id, period, score, updated_at)
                VALUES (post_record.id, 'month', viral_score, now())
                ON CONFLICT (post_id, period) 
                DO UPDATE SET score = viral_score, updated_at = now();
            END IF;
            
            -- Trending del año
            INSERT INTO public.trending_posts (post_id, period, score, updated_at)
            VALUES (post_record.id, 'year', viral_score, now())
            ON CONFLICT (post_id, period) 
            DO UPDATE SET score = viral_score, updated_at = now();
        END IF;
    END LOOP;
END;
$$;

-- ============================================================================
-- 4. FUNCIÓN PRINCIPAL: GET SMART FEED (Algoritmo Completo)
-- ============================================================================

DROP FUNCTION IF EXISTS get_smart_feed();
CREATE OR REPLACE FUNCTION get_smart_feed()
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
        -- Posts normales y quotes
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
            -- SCORING ALGORITHM
            (
                -- Prioridad Máxima: Misma facultad (+50)
                CASE WHEN pr.faculty = my_faculty AND my_faculty IS NOT NULL THEN 50.0 ELSE 0.0 END +
                
                -- Prioridad Alta: Usuario que sigo (+30)
                CASE WHEN EXISTS(
                    SELECT 1 FROM public.followers 
                    WHERE follower_id = my_user_id AND following_id = p.user_id
                ) THEN 30.0 ELSE 0.0 END +
                
                -- Prioridad Media: Misma universidad, otra facultad (+10)
                CASE WHEN pr.faculty != my_faculty AND pr.faculty IS NOT NULL AND my_faculty IS NOT NULL THEN 10.0 ELSE 0.0 END +
                
                -- Factor de Frescura (decaimiento temporal)
                CASE 
                    WHEN p.created_at > now() - INTERVAL '4 hours' THEN 40.0
                    WHEN p.created_at > now() - INTERVAL '12 hours' THEN 30.0
                    WHEN p.created_at > now() - INTERVAL '24 hours' THEN 20.0
                    WHEN p.created_at > now() - INTERVAL '2 days' THEN 10.0
                    WHEN p.created_at > now() - INTERVAL '7 days' THEN 5.0
                    ELSE 1.0
                END +
                
                -- Bonus por engagement
                ((SELECT count(*) FROM public.likes WHERE post_id = p.id) * 0.5) +
                ((SELECT count(*) FROM public.comments WHERE post_id = p.id) * 1.0) +
                ((SELECT count(*) FROM public.shares WHERE post_id = p.id) * 2.0)
            ) as relevance_score,
            
            -- Verificar si es trending
            EXISTS(SELECT 1 FROM public.trending_posts WHERE post_id = p.id) as is_trending,
            (SELECT period FROM public.trending_posts WHERE post_id = p.id ORDER BY score DESC LIMIT 1) as trending_period,
            
            NULL::JSONB as reposters_data
            
        FROM public.posts p
        JOIN public.profiles pr ON p.user_id = pr.id
        LEFT JOIN public.posts op ON p.original_post_id = op.id
        LEFT JOIN public.profiles opr ON op.user_id = opr.id
        WHERE p.deleted_at IS NULL
        
        UNION ALL
        
        -- Reposts desde tabla shares (con agrupamiento corregido)
        SELECT 
            p.id,
            (array_agg(s.user_id ORDER BY s.created_at DESC))[1] as user_id, -- El último que compartió
            NULL::TEXT as content,
            p.image_url,
            MAX(s.created_at) as created_at,
            p.is_official,
            FALSE as is_quote,
            TRUE as is_repost,
            p.id as original_post_id,
            p.deleted_at,
            to_jsonb((array_agg(pr ORDER BY s.created_at DESC))[1]) as author_data, -- Perfil del último que compartió
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
            
            -- SCORING para reposts (agregado)
            (
                MAX(CASE WHEN spr.faculty = my_faculty AND my_faculty IS NOT NULL THEN 50.0 ELSE 0.0 END) +
                MAX(CASE WHEN EXISTS(
                    SELECT 1 FROM public.followers 
                    WHERE follower_id = my_user_id AND following_id = s.user_id
                ) THEN 30.0 ELSE 0.0 END) +
                (COUNT(DISTINCT s.id) * 5.0) + -- Bonus por cantidad de compartidos
                CASE 
                    WHEN MAX(s.created_at) > now() - INTERVAL '4 hours' THEN 40.0
                    WHEN MAX(s.created_at) > now() - INTERVAL '12 hours' THEN 30.0
                    ELSE 10.0
                END
            ) as relevance_score,
            
            EXISTS(SELECT 1 FROM public.trending_posts WHERE post_id = p.id) as is_trending,
            (SELECT period FROM public.trending_posts WHERE post_id = p.id ORDER BY score DESC LIMIT 1) as trending_period,
            
            -- Datos de quiénes compartieron (para agrupamiento)
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
        JOIN public.profiles pr ON s.user_id = pr.id
        JOIN public.profiles ppr ON p.user_id = ppr.id
        JOIN public.profiles spr ON s.user_id = spr.id
        WHERE p.deleted_at IS NULL
        GROUP BY p.id, p.image_url, p.is_official, p.content, p.created_at, ppr.id, p.deleted_at
    )
    SELECT * FROM feed_items
    ORDER BY 
        is_trending DESC,
        relevance_score DESC,
        created_at DESC
    LIMIT 100;
END;
$$;

-- ============================================================================
-- 5. FUNCIÓN: GET TRENDING POSTS
-- ============================================================================

DROP FUNCTION IF EXISTS get_trending_posts(TEXT);
CREATE OR REPLACE FUNCTION get_trending_posts(period_param TEXT DEFAULT 'day')
RETURNS TABLE (
    post_id UUID,
    score DECIMAL(10,2),
    post_data JSONB,
    author_data JSONB,
    interactions_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tp.post_id,
        tp.score,
        jsonb_build_object(
            'id', p.id,
            'content', p.content,
            'image_url', p.image_url,
            'created_at', p.created_at,
            'is_official', p.is_official
        ) as post_data,
        to_jsonb(pr) as author_data,
        tp.total_interactions
    FROM public.trending_posts tp
    JOIN public.posts p ON tp.post_id = p.id
    JOIN public.profiles pr ON p.user_id = pr.id
    WHERE tp.period = period_param
      AND p.deleted_at IS NULL
    ORDER BY tp.score DESC
    LIMIT 20;
END;
$$;

-- ============================================================================
-- 6. TRIGGER: AUTO-UPDATE TRENDING
-- ============================================================================

-- Trigger para actualizar trending cuando hay nueva interacción
DROP FUNCTION IF EXISTS trigger_update_trending() CASCADE;
CREATE OR REPLACE FUNCTION trigger_update_trending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Actualizar trending posts cada vez que hay interacción
    -- (En producción, esto debería ser un job programado, no un trigger)
    PERFORM update_trending_posts();
    RETURN NEW;
END;
$$;

-- Aplicar trigger a likes, shares y comments
DROP TRIGGER IF EXISTS trigger_likes_trending ON public.likes;
CREATE TRIGGER trigger_likes_trending
    AFTER INSERT ON public.likes
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_update_trending();

DROP TRIGGER IF EXISTS trigger_shares_trending ON public.shares;
CREATE TRIGGER trigger_shares_trending
    AFTER INSERT ON public.shares
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_update_trending();

DROP TRIGGER IF EXISTS trigger_comments_trending ON public.comments;
CREATE TRIGGER trigger_comments_trending
    AFTER INSERT ON public.comments
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_update_trending();

-- ============================================================================
-- 7. POLÍTICAS RLS PARA TRENDING
-- ============================================================================

ALTER TABLE public.trending_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trending_select_all" ON public.trending_posts;
CREATE POLICY "trending_select_all" ON public.trending_posts FOR SELECT USING (true);

-- ============================================================================
-- FIN DEL ALGORITMO AVANZADO
-- ============================================================================
