-- ============================================================================
-- SISTEMA DUAL DE COMPARTIDOS: REPOST & QUOTE
-- Arquitectura: PostgreSQL (Supabase) para Red Social Universitaria
-- Autor: Arquitecto Senior Fullstack
-- ============================================================================

-- ============================================================================
-- 1. TABLAS PRINCIPALES
-- ============================================================================

-- 1.1 Asegurar columnas en PROFILES para segmentación
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university_id UUID;

-- 1.2 Asegurar columnas en POSTS para Quotes y Soft Delete
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_quote BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 1.3 Crear tabla SHARES (para Reposts rápidos)
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, post_id) -- Evita duplicados
);

-- 1.4 Crear/Actualizar tabla NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    entity_id UUID, -- Para quotes (ID del nuevo post)
    group_count INTEGER DEFAULT 1,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS group_count INTEGER DEFAULT 1;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Eliminar restricción antigua y crear nueva
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('repost', 'quote', 'like', 'official', 'follow', 'comment', 'reply'));

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 2.1 SHARES
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shares_select_all" ON public.shares;
CREATE POLICY "shares_select_all" ON public.shares FOR SELECT USING (true);

DROP POLICY IF EXISTS "shares_insert_own" ON public.shares;
CREATE POLICY "shares_insert_own" ON public.shares FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "shares_delete_own" ON public.shares;
CREATE POLICY "shares_delete_own" ON public.shares FOR DELETE USING (auth.uid() = user_id);

-- 2.2 NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. FUNCIONES RPC
-- ============================================================================

-- 3.1 TOGGLE REPOST (Estilo TikTok)
DROP FUNCTION IF EXISTS toggle_repost(UUID);
CREATE OR REPLACE FUNCTION toggle_repost(post_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_share_id UUID;
BEGIN
    -- Buscar si ya existe el repost
    SELECT id INTO existing_share_id 
    FROM public.shares
    WHERE user_id = auth.uid() AND post_id = post_id_param;

    IF existing_share_id IS NOT NULL THEN
        -- Ya existe: eliminar (deshacer)
        DELETE FROM public.shares WHERE id = existing_share_id;
        RETURN FALSE;
    ELSE
        -- No existe: crear
        INSERT INTO public.shares (user_id, post_id)
        VALUES (auth.uid(), post_id_param);
        RETURN TRUE;
    END IF;
END;
$$;

-- 3.2 SOFT DELETE POST
DROP FUNCTION IF EXISTS soft_delete_post(UUID);
CREATE OR REPLACE FUNCTION soft_delete_post(post_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.posts
    SET deleted_at = now()
    WHERE id = post_id_param AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- 3.3 GET PRIORITY FEED (Segmentación por Facultad)
DROP FUNCTION IF EXISTS get_priority_feed();
CREATE OR REPLACE FUNCTION get_priority_feed()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    is_official BOOLEAN,
    is_quote BOOLEAN,
    original_post_id UUID,
    deleted_at TIMESTAMPTZ,
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
    SELECT faculty INTO my_faculty FROM public.profiles WHERE id = auth.uid();

    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        p.is_official,
        COALESCE(p.is_quote, FALSE) as is_quote,
        p.original_post_id,
        p.deleted_at,
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
                    'deleted_at', op.deleted_at,
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

-- 3.4 GET PROFILE SHARES (Reposts + Quotes)
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
    original_post_data JSONB,
    author_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Reposts (desde tabla shares)
    SELECT 
        'repost'::TEXT as type,
        p.id,
        s.user_id,
        NULL::TEXT as content, -- Contenido propio (nulo en repost)
        p.image_url,
        s.created_at,
        p.id as original_post_id, -- Referencia al original
        jsonb_build_object(
            'id', p.id,
            'content', p.content,
            'image_url', p.image_url,
            'created_at', p.created_at,
            'deleted_at', p.deleted_at,
            'profiles', to_jsonb(ppr)
        ) as original_post_data,
        to_jsonb(pr) as author_data -- Perfil de quien comparte
    FROM public.shares s
    JOIN public.posts p ON s.post_id = p.id
    JOIN public.profiles pr ON s.user_id = pr.id -- Sharer
    JOIN public.profiles ppr ON p.user_id = ppr.id -- Original Author
    WHERE s.user_id = user_id_param
    
    UNION ALL
    
    -- Quotes (posts con original_post_id)
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
        to_jsonb(pr) as author_data
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

-- 3.5 GET COMPLETE FEED (Posts + Reposts from shares)
DROP FUNCTION IF EXISTS get_complete_feed();
CREATE OR REPLACE FUNCTION get_complete_feed()
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
    original_post_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    my_faculty TEXT;
BEGIN
    SELECT faculty INTO my_faculty FROM public.profiles WHERE id = auth.uid();

    RETURN QUERY
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
        END as original_post_data
    FROM public.posts p
    JOIN public.profiles pr ON p.user_id = pr.id
    LEFT JOIN public.posts op ON p.original_post_id = op.id
    LEFT JOIN public.profiles opr ON op.user_id = opr.id
    WHERE p.deleted_at IS NULL
    
    UNION ALL
    
    -- Reposts desde tabla shares
    SELECT 
        p.id,
        s.user_id,
        NULL::TEXT as content,  -- Reposts no tienen contenido propio
        p.image_url,
        s.created_at,
        p.is_official,
        FALSE as is_quote,
        TRUE as is_repost,
        p.id as original_post_id,  -- El post compartido
        p.deleted_at,
        to_jsonb(pr) as author_data,  -- Perfil de quien compartió
        (SELECT count(*) FROM public.likes WHERE post_id = p.id) as likes_count,
        (SELECT count(*) FROM public.comments WHERE post_id = p.id) as comments_count,
        jsonb_build_object(
            'id', p.id,
            'content', p.content,
            'image_url', p.image_url,
            'created_at', p.created_at,
            'deleted_at', p.deleted_at,
            'profiles', to_jsonb(ppr)
        ) as original_post_data  -- Datos del post original
    FROM public.shares s
    JOIN public.posts p ON s.post_id = p.id
    JOIN public.profiles pr ON s.user_id = pr.id  -- Quien compartió
    JOIN public.profiles ppr ON p.user_id = ppr.id  -- Autor original
    WHERE p.deleted_at IS NULL
    
    ORDER BY created_at DESC
    LIMIT 100;
END;
$$;

-- ============================================================================
-- 4. TRIGGERS PARA NOTIFICACIONES INTELIGENTES
-- ============================================================================

-- 4.1 TRIGGER: Notificación de Repost con Agrupamiento (Batching)
DROP FUNCTION IF EXISTS handle_repost_notification() CASCADE;
CREATE OR REPLACE FUNCTION handle_repost_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner_id UUID;
    existing_notif_id UUID;
BEGIN
    -- Obtener el dueño del post original
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;

    -- Regla de Silencio: no notificar si es auto-repost
    IF post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Buscar notificación existente no leída para agrupar
    SELECT id INTO existing_notif_id 
    FROM public.notifications
    WHERE user_id = post_owner_id 
      AND post_id = NEW.post_id 
      AND type = 'repost' 
      AND read = FALSE;

    IF existing_notif_id IS NOT NULL THEN
        -- Actualizar contador y último actor
        UPDATE public.notifications
        SET group_count = group_count + 1,
            actor_id = NEW.user_id,
            created_at = now()
        WHERE id = existing_notif_id;
    ELSE
        -- Crear nueva notificación
        INSERT INTO public.notifications (user_id, actor_id, post_id, type)
        VALUES (post_owner_id, NEW.user_id, NEW.post_id, 'repost');
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_repost_notification ON public.shares;
CREATE TRIGGER trigger_repost_notification
    AFTER INSERT ON public.shares
    FOR EACH ROW EXECUTE FUNCTION handle_repost_notification();

-- 4.2 TRIGGER: Notificación de Quote (Individual)
DROP FUNCTION IF EXISTS handle_quote_notification() CASCADE;
CREATE OR REPLACE FUNCTION handle_quote_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    original_owner_id UUID;
BEGIN
    -- Solo procesar si es un quote (tiene original_post_id y contenido)
    IF NEW.original_post_id IS NOT NULL AND NEW.content IS NOT NULL THEN
        SELECT user_id INTO original_owner_id 
        FROM public.posts 
        WHERE id = NEW.original_post_id;
        
        -- Regla de Silencio: no notificar si es auto-quote
        IF original_owner_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, post_id, entity_id, type)
            VALUES (original_owner_id, NEW.user_id, NEW.original_post_id, NEW.id, 'quote');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_quote_notification ON public.posts;
CREATE TRIGGER trigger_quote_notification
    AFTER INSERT ON public.posts
    FOR EACH ROW EXECUTE FUNCTION handle_quote_notification();

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
