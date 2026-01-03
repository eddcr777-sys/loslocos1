-- Trigger para crear notificaciones automáticamente cuando alguien cita un post
-- Esto asegura que el autor original sea notificado cada vez que alguien usa su contenido en un nuevo quote.

-- 1. Función que se ejecuta al insertar en 'quotes'
CREATE OR REPLACE FUNCTION public.handle_new_quote_notification()
RETURNS TRIGGER AS $$
DECLARE
    original_author_id UUID;
BEGIN
    -- Obtener el autor del post original
    SELECT user_id INTO original_author_id
    FROM public.posts
    WHERE id = NEW.original_post_id;

    -- Solo insertar si el autor existe y no es el mismo que está citando (auto-cita)
    IF original_author_id IS NOT NULL AND original_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (
            user_id, 
            actor_id, 
            type, 
            post_id,
            content
        )
        VALUES (
            original_author_id, 
            NEW.user_id, 
            'quote', 
            NEW.original_post_id,
            NEW.content
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el Trigger
DROP TRIGGER IF EXISTS on_quote_created ON public.quotes;

CREATE TRIGGER on_quote_created
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_quote_notification();

DO $$
BEGIN
    RAISE NOTICE 'Trigger de notificaciones para Quotes creado con éxito.';
END $$;
