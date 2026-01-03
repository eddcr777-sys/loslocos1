-- =================================================================
-- SCRIPT DE SEGURIDAD Y REPARACIÓN NUCLEAR (v2.0 - SECURE & ROBUST)
-- =================================================================
-- Este script arregla el problema de "App Muerta" asegurando que:
-- 1. Los permisos básicos (SELECT, INSERT) estén garantizados.
-- 2. Las políticas (RLS) sean dinámicas: miran la tabla profiles, NO solo el JWT.
-- 3. Los administradores tengan acceso garantizado a todo.

BEGIN;

-- ----------------------------------------------------------------
-- 1. LIMPIEZA DE POLÍTICAS ANTIGUAS (Evita conflictos)
-- ----------------------------------------------------------------
-- Desactivamos temporalmente para limpiar
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- 2. RE-HABILITACIÓN DE SEGURIDAD
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 3. POLÍTICAS ROBUSTAS PARA PERFILES
-- ----------------------------------------------------------------
-- Lectura: Todo el mundo puede ver perfiles básicos
CREATE POLICY "Public Profiles Access" 
ON profiles FOR SELECT 
USING (true);

-- Escritura: Solo el dueño puede editar su propio perfil
-- O UN ADMIN (Aquí está la clave para que no te bloquees tú mismo)
CREATE POLICY "Self or Admin Update" 
ON profiles FOR UPDATE 
USING (
    auth.uid() = id 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo'))
);

-- Insertar: Al registrarse
CREATE POLICY "Self Insert" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------
-- 4. PERMISOS DE FUNCIONES (El error común de "Permission Denied")
-- ----------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Permitir ejecutar las funciones críticas a cualquier usuario logueado
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_growth() TO authenticated;
-- (Si tienes otras funciones RPC, el patrón es el mismo)

-- ----------------------------------------------------------------
-- 5. ACCESO A TABLAS CRÍTICAS (Admin Logs, Estadísticas)
-- ----------------------------------------------------------------
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin Access Only" ON admin_logs;

-- Esta política es DINÁMICA: consulta la DB real, no el token viejo
CREATE POLICY "Admin Access Only" 
ON admin_logs 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'ceo', 'institutional')
    )
);

-- ----------------------------------------------------------------
-- 6. PERMANENCIA DE DATOS DE SESIÓN
-- ----------------------------------------------------------------
-- Aseguramos que auth.users siempre tenga el user_type actualizado
-- Esto es un "Safety Net" para cuando la app recarga
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users 
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('user_type', NEW.user_type)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
CREATE TRIGGER on_profile_role_change
AFTER UPDATE OF user_type ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role();

COMMIT;

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de Seguridad Restaurado y Fortalecido.';
END $$;
