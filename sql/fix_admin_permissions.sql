-- ======================================================
-- SCRIPT DE PERMISOS PARA DASHBOARD DE ADMINISTRACIÓN
-- ======================================================

-- 1. Dar permiso para ejecutar el RPC de estadísticas
-- Si la función no existe, este paso fallará, por eso la recreamos primero
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS json AS $$
DECLARE
    users_count bigint;
    posts_count bigint;
    comments_count bigint;
BEGIN
    SELECT count(*) INTO users_count FROM public.profiles;
    SELECT count(*) INTO posts_count FROM public.posts WHERE deleted_at IS NULL;
    SELECT count(*) INTO comments_count FROM public.comments;

    RETURN json_build_object(
        'users_count', users_count,
        'posts_count', posts_count,
        'comments_count', comments_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permiso de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO service_role;


-- 2. Asegurar que los Admins pueden leer LOGS
-- Primero activamos RLS si no lo está
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Borramos políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Admins can read logs" ON public.admin_logs;

-- Nueva política: Solo admins, ceos e inst pueden leer logs
CREATE POLICY "Admins can read logs"
ON public.admin_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'ceo', 'institutional')
    )
);

-- 3. Asegurar que los Admins pueden leer todos los PERFILES para estadísticas/gestión
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true); -- Permitimos lectura general para todos, pero aseguremos que el Admin no sea bloqueado

-- 4. Permisos para que el RPC de crecimiento semanal funcione
GRANT EXECUTE ON FUNCTION public.get_weekly_growth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_growth() TO service_role;

RAISE NOTICE 'Permisos de administración actualizados correctamente.';
