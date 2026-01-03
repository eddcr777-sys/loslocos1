-- Trigger para crear notificaciones automáticamente cuando alguien sigue a un usuario
-- Esto asegura que SIEMPRE se cree la notificación, sin importar desde dónde se haga el follow (app, db, etc.)

-- 1. Función que se ejecuta al insertar en 'followers'
CREATE OR REPLACE FUNCTION public.handle_new_follower()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar notificación
    INSERT INTO public.notifications (user_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el Trigger (borrar anterior si existe para evitar duplicados)
DROP TRIGGER IF EXISTS on_follower_created ON public.followers;

CREATE TRIGGER on_follower_created
AFTER INSERT ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_follower();

-- 3. (Opcional) Trigger para limpiar notificación si dejan de seguir
CREATE OR REPLACE FUNCTION public.handle_unfollow()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.notifications 
    WHERE user_id = OLD.following_id 
    AND actor_id = OLD.follower_id 
    AND type = 'follow';
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follower_deleted ON public.followers;

CREATE TRIGGER on_follower_deleted
AFTER DELETE ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.handle_unfollow();
