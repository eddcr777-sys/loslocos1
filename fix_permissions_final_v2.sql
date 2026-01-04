-- ==============================================================================
-- 🚑 FIX FINAL DE PERMISOS (CORREGIDO)
-- ==============================================================================

-- 1. Dar permisos a funciones de chequeo de roles (Vital para RLS)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

GRANT EXECUTE ON FUNCTION public.is_institutional() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_institutional() TO service_role;

-- 2. Dar permisos a soft_delete_post (Solo la versión con UUID)
-- El error anterior fue intentar dar permiso a soft_delete_post() sin argumentos.
GRANT EXECUTE ON FUNCTION public.soft_delete_post(uuid) TO authenticated;

-- 3. Asegurar search_path correcto
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_institutional() SET search_path = public;

-- 4. Fix del Trigger de Roles
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type IS DISTINCT FROM OLD.user_type AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'No tienes permisos para cambiar tu rol de usuario.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
