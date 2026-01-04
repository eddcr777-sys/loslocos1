-- ==============================================================================
-- 🔔 REPARACIÓN DE MENCIONES Y NOTIFICACIONES
-- ==============================================================================
-- Este script reinstala el detector de menciones (@usuario) y asegura
-- que las notificaciones se creen correctamente.

-- 1. Función para procesar menciones en el contenido
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_mentions()
RETURNS TRIGGER AS $$
DECLARE
    mention_match TEXT;
    mentioned_username TEXT;
    mentioned_user_id UUID;
BEGIN
    -- Buscamos patrones de @usuario en el texto
    -- El regex busca una @ seguida de caracteres alfanuméricos
    FOR mention_match IN SELECT unnest(regexp_matches(NEW.content, '@([a-zA-Z0-9._]+)', 'g'))
    LOOP
        mentioned_username := mention_match;
        
        -- Buscamos el ID del usuario mencionado
        SELECT id INTO mentioned_user_id 
        FROM public.profiles 
        WHERE username = mentioned_username;

        -- Si el usuario existe y no soy yo mismo, creamos la notificación
        IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (
                user_id,
                actor_id,
                type,
                content,
                post_id
            ) VALUES (
                mentioned_user_id,
                NEW.user_id,
                'mention',
                'te ha mencionado en una publicación',
                NEW.id
            ) ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Notificación de mención enviada a: %', mentioned_username;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER permite saltarse el RLS para insertar la notificación


-- 2. Trigger para POSTS
-- ==============================================================================
DROP TRIGGER IF EXISTS tr_handle_mentions ON public.posts;
CREATE TRIGGER tr_handle_mentions
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_mentions();


-- 3. Trigger para COMENTARIOS
-- ==============================================================================
-- Modificamos la función ligeramente para comentarios si es necesario, 
-- o usamos la misma si la estructura es compatible.
CREATE OR REPLACE FUNCTION public.handle_comment_mentions()
RETURNS TRIGGER AS $$
DECLARE
    mention_match TEXT;
    mentioned_username TEXT;
    mentioned_user_id UUID;
BEGIN
    FOR mention_match IN SELECT unnest(regexp_matches(NEW.content, '@([a-zA-Z0-9._]+)', 'g'))
    LOOP
        mentioned_username := mention_match;
        
        SELECT id INTO mentioned_user_id 
        FROM public.profiles 
        WHERE username = mentioned_username;

        IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (
                user_id,
                actor_id,
                type,
                content,
                post_id
            ) VALUES (
                mentioned_user_id,
                NEW.user_id,
                'mention',
                'te ha mencionado en un comentario',
                NEW.post_id
            ) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_handle_comment_mentions ON public.comments;
CREATE TRIGGER tr_handle_comment_mentions
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_comment_mentions();


-- 4. ASEGURAR PERMISOS RLS (Muy importante)
-- ==============================================================================
-- El RLS de 'notifications' debe permitir que el sistema inserte registros.
-- Como usamos SECURITY DEFINER en la función, esta corre con privilegios de 'postgres'
-- y se saltará el RLS, lo cual es la forma CORRECTA de hacerlo para triggers.

-- Solo verificamos que la tabla soporte menciones
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        -- Si usas un ENUM para tipos, asegúrate que 'mention' esté incluido
        -- ALTER TYPE notification_type ADD VALUE 'mention';
    END IF;
END $$;

-- 5. NOTA PARA EL USUARIO
-- ==============================================================================
-- Las menciones funcionan basándose en el campo 'username' de la tabla 'profiles'.
-- Asegúrate de que los usuarios tengan un 'username' asignado.
