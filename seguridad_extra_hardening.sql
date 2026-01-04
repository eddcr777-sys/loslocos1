-- ==============================================================================
-- 🔐 SECURITY HARDENING: PROTECCIÓN DE FUNCIONES Y DATOS
-- ==============================================================================
-- Este script refuerza la seguridad sin modificar las políticas RLS existentes.

-- 1. REVOCAR PERMISOS PÚBLICOS EN FUNCIONES CRÍTICAS
-- Evita que usuarios NO logueados (anon) intenten ejecutar lógica de negocio.
-- ==============================================================================

-- Primero, quitamos permisos a 'public' y 'anon' de funciones sensibles
REVOKE EXECUTE ON FUNCTION public.soft_delete_post FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.soft_delete_post FROM anon;

REVOKE EXECUTE ON FUNCTION public.delete_user_account FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_account FROM anon;

REVOKE EXECUTE ON FUNCTION public.toggle_repost FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_repost FROM anon;

REVOKE EXECUTE ON FUNCTION public.broadcast_official_announcement FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.broadcast_official_announcement FROM anon;

-- Ahora, garantizamos que SOLO los autenticados puedan usarlas
GRANT EXECUTE ON FUNCTION public.soft_delete_post TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_repost TO authenticated;
GRANT EXECUTE ON FUNCTION public.broadcast_official_announcement TO authenticated;


-- 2. HARDENING DE FUNCIONES "SECURITY DEFINER"
-- Fija el search_path para evitar "Hijacking" de funciones. 
-- Esto asegura que la función use SIEMPRE el esquema 'public' y no uno inyectado por un hacker.
-- ==============================================================================

ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_institutional() SET search_path = public;
-- Si tus otras funciones RPC fueron creadas, las aseguramos también:
-- (Nota: Si alguna no existe, el script continuará o dará un error leve, puedes ignorarlo si no usas esa funcióm)

-- Asegura soft_delete_post (asumiendo que podría ser Security Definer para bypassear algo, o simplemente buenas prácticas)
ALTER FUNCTION public.soft_delete_post SET search_path = public;


-- 3. CONSTRAINTS DE DATOS (INTEGRIDAD)
-- Reglas inquebrantables a nivel de base de datos.
-- ==============================================================================

-- A. PROFILES: Asegurar consistencia en nombres y roles
ALTER TABLE public.profiles 
    ADD CONSTRAINT check_username_length CHECK (char_length(username) >= 3),
    ADD CONSTRAINT check_user_type_valid CHECK (user_type IN ('common', 'popular', 'admin', 'ceo', 'institutional'));

-- B. POSTS: Evitar posts vacíos (debe tener texto O imagen)
-- Nota: Usamos 'make_valid' para limpiar datos viejos si fuera necesario, 
-- pero aquí aplicamos la regla para el futuro.
ALTER TABLE public.posts
    ADD CONSTRAINT check_post_content_not_empty 
    CHECK (
        (content IS NOT NULL AND length(trim(content)) > 0) 
        OR 
        (image_url IS NOT NULL AND length(trim(image_url)) > 0)
    );

-- C. LIKES: Evitar contadores negativos (si usas columnas de conteo cacheadas)
-- Si tienes columnas como 'likes_count' en posts, esto es vital:
-- ALTER TABLE public.posts ADD CONSTRAINT check_likes_positive CHECK (likes_count >= 0);
-- (Comentado porque depende de tu esquema exacto, pero recomendado si existe la columna)


-- 4. ÍNDICES DE SEGURIDAD
-- Mejoran el rendimiento de las validaciones de seguridad (RLS)
-- ==============================================================================

-- Índice en user_id para posts (acelera la verificación de "soy el dueño")
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Índice en user_type (acelera la verificación de permisos de admin)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Índice en deleted_at (acelera el filtrado de contenido borrado)
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON public.posts(deleted_at) WHERE deleted_at IS NOT NULL;


-- ==============================================================================
-- FIN DEL HARDENING
-- ==============================================================================
