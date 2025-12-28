-- ============================================================================
-- SISTEMA DE TENDENCIAS, RECOMPENSAS Y MENCIONES (@USER)
-- ============================================================================

-- 1. BASE DE DATOS PARA TENDENCIAS Y RECOMPENSAS
CREATE TABLE IF NOT EXISTS public.user_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL, -- 'trending_top_1', 'trending_top_10', 'viral_post'
    period TEXT NOT NULL, -- 'day', 'week', 'month', 'year'
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. FUNCIÓN PARA CALCULAR TENDENCIAS POR PERIODO
CREATE OR REPLACE FUNCTION public.update_trending_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Limpiar tendencias antiguas que no sean top
    DELETE FROM public.trending_posts WHERE updated_at < now() - INTERVAL '1 hour';

    -- Calcular tendencia DIARIA
    INSERT INTO public.trending_posts (post_id, period, score)
    SELECT 
        p.id, 
        'day',
        ((SELECT count(*) FROM public.likes l WHERE l.post_id = p.id AND l.created_at > now() - INTERVAL '1 day') * 1.0) +
        ((SELECT count(*) FROM public.comments c WHERE c.post_id = p.id AND c.created_at > now() - INTERVAL '1 day') * 2.0) +
        ((SELECT count(*) FROM public.shares s WHERE s.post_id = p.id AND s.created_at > now() - INTERVAL '1 day') * 3.0) as calculated_score
    FROM public.posts p
    WHERE p.created_at > now() - INTERVAL '3 days' AND p.deleted_at IS NULL
    GROUP BY p.id
    HAVING 
        ((SELECT count(*) FROM public.likes l WHERE l.post_id = p.id AND l.created_at > now() - INTERVAL '1 day') +
         (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id AND c.created_at > now() - INTERVAL '1 day') +
         (SELECT count(*) FROM public.shares s WHERE s.post_id = p.id AND s.created_at > now() - INTERVAL '1 day')) > 2
    ON CONFLICT (post_id, period) DO UPDATE SET score = EXCLUDED.score, updated_at = now();

    -- Calcular tendencia SEMANAL
    INSERT INTO public.trending_posts (post_id, period, score)
    SELECT p.id, 'week', 
        ((SELECT count(*) FROM public.likes WHERE post_id = p.id AND created_at > now() - INTERVAL '7 days') * 1) +
        ((SELECT count(*) FROM public.comments WHERE post_id = p.id AND created_at > now() - INTERVAL '7 days') * 2) +
        ((SELECT count(*) FROM public.shares WHERE post_id = p.id AND created_at > now() - INTERVAL '7 days') * 3)
    FROM public.posts p WHERE p.created_at > now() - INTERVAL '10 days' AND p.deleted_at IS NULL
    ON CONFLICT (post_id, period) DO UPDATE SET score = EXCLUDED.score, updated_at = now();

    -- LOGICA DE RECOMPENSAS: Subir de rango a "popular" si el post entra en Top Mensual
    UPDATE public.profiles
    SET user_type = 'popular'
    WHERE id IN (
        SELECT p.user_id 
        FROM public.trending_posts tp 
        JOIN public.posts p ON tp.post_id = p.id 
        WHERE tp.score > 100 AND tp.period = 'month'
    ) AND user_type = 'common';

END;
$$;

-- 3. LOGICA DE MENCIONES (@USER)
-- Función que detecta @username y crea una notificación
CREATE OR REPLACE FUNCTION public.handle_post_mentions()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_username TEXT;
    target_user_id UUID;
    mention_matches TEXT[];
BEGIN
    -- Buscar todos los @username en el contenido del post
    -- Regex simplificado para buscar palabras que empiecen con @
    mention_matches := ARRAY(SELECT (regexp_matches(NEW.content, '@(\w+)', 'g'))[1]);
    
    IF array_length(mention_matches, 1) > 0 THEN
        -- Para cada mención encontrada
        FOREACH mentioned_username IN ARRAY mention_matches
        LOOP
            -- Buscar el ID del usuario mencionado
            SELECT id INTO target_user_id FROM public.profiles WHERE username = mentioned_username;
            
            -- Si el usuario existe y no es el mismo autor
            IF target_user_id IS NOT NULL AND target_user_id != NEW.user_id THEN
                INSERT INTO public.notifications (user_id, actor_id, type, post_id, created_at)
                VALUES (target_user_id, NEW.user_id, 'mention', NEW.id, now());
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar al insertar un post
DROP TRIGGER IF EXISTS tr_post_mentions ON public.posts;
CREATE TRIGGER tr_post_mentions
AFTER INSERT ON public.posts
FOR EACH ROW
WHEN (NEW.content IS NOT NULL)
EXECUTE FUNCTION public.handle_post_mentions();

-- 4. ADAPTACIÓN DE NOTIFICACIONES (Asegurar que el tipo 'mention' existe)
-- Nota: PostgreSQL ENUMs son difíciles de alterar. Usamos un CHECK si es necesario.
-- Si notifications.type es una columna TEXT con check:
-- ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
-- ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
-- CHECK (type IN ('repost', 'quote', 'like', 'official', 'follow', 'comment', 'reply', 'mention'));
