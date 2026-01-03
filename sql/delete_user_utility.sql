-- ============================================
-- FUNCIÓN PARA ELIMINACIÓN TOTAL (VERSIÓN FINAL)
-- ============================================
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- 1. Logs de Seguridad
    DELETE FROM public.security_audit_logs WHERE user_id = target_user_id;

    -- 2. Interacciones y relaciones
    DELETE FROM public.notifications WHERE user_id = target_user_id OR actor_id = target_user_id;
    DELETE FROM public.likes WHERE user_id = target_user_id;
    DELETE FROM public.comments WHERE user_id = target_user_id;
    DELETE FROM public.shares WHERE user_id = target_user_id;
    DELETE FROM public.followers WHERE follower_id = target_user_id OR following_id = target_user_id;
    
    -- 3. Contenido
    DELETE FROM public.stories WHERE user_id = target_user_id;
    DELETE FROM public.posts WHERE user_id = target_user_id;
    
    -- 4. Perfil público
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    -- 5. Auth
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
