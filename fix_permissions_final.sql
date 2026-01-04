-- ==============================================================================
-- 🚑 FIX FINAL DE PERMISOS: FUNCIONES DE AYUDA
-- ==============================================================================
-- Este script otorga permiso explícito a 'authenticated' para usar las funciones
-- que son llamadas por las políticas RLS. Sin esto, el RLS falla con "permission denied".

-- 1. Dar permisos a funciones de chequeo de roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

GRANT EXECUTE ON FUNCTION public.is_institutional() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_institutional() TO service_role;

-- 2. Dar permisos a funciones de borrado (si se te bloqueó el borrar story)
GRANT EXECUTE ON FUNCTION public.soft_delete_post(uuid) TO authenticated;
-- (Por si acaso la variante sin argumentos existe)
GRANT EXECUTE ON FUNCTION public.soft_delete_post() TO authenticated;

-- 3. Asegurar search_path correcto
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_institutional() SET search_path = public;

-- 4. Verificar Trigger de Roles (para que no falle al editar otros campos)
-- Aseguramos que el trigger de protección solo salte si CAMBIAS el rol, no si cambias el nombre.
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario intenta cambiar su rol y NO es un admin
  IF NEW.user_type IS DISTINCT FROM OLD.user_type AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'No tienes permisos para cambiar tu rol de usuario.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Nota: SECURITY DEFINER es vital aquí para que 'is_admin()' corra con permisos elevados dentro del trigger

