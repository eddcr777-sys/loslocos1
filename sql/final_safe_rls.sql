-- =================================================================
-- FINAL SAFE RLS POLICY SCRIPT (v3.0 - RECURSION PROOF)
-- =================================================================
-- Objetivo: Seguridad robusta SIN bloqueos recursivos.
-- Estrategia: "Profiles es público para leer, privado para editar".

BEGIN;

-- 1. DESACTIVAR TODO TEMPORALMENTE (Limpieza)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;

-- Borrar TODAS las políticas previas para empezar limpio
DROP POLICY IF EXISTS "Public Profiles Access" ON profiles;
DROP POLICY IF EXISTS "Self or Admin Update" ON profiles;
DROP POLICY IF EXISTS "Self Insert" ON profiles;
-- (Limpiar otras si existen, por seguridad)
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;

-- 2. HABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE PERFILES (La parte crítica)
-- LECTURA: PÚBLICA (USING true).
-- Esto rompe el ciclo de recursión. Todos pueden ver nombres y fotos.
CREATE POLICY "Public Profiles" 
ON profiles FOR SELECT 
USING (true);

-- ESCRITURA: Solo el dueño.
-- NO chequeamos si es admin aquí para evitar complejidad. Solo el dueño edita su perfil.
-- Si un admin necesita editar, puede usar una función SQL SECURITY DEFINER o cambiar el rol via SQL.
CREATE POLICY "Self Update Profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- INSERTAR: Al registrarse
CREATE POLICY "Self Insert Profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. POLÍTICAS DE POSTS & CONTENIDO
-- Lectura pública (si no está borrado)
CREATE POLICY "Public Posts" 
ON posts FOR SELECT 
USING (deleted_at IS NULL);

-- Crear posts (Solo autenticados)
CREATE POLICY "Auth Create Post" 
ON posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Editar/Borrar posts (Dueño OR Admin)
-- Aquí usamos una subquery segura porque 'profiles' es public-read
CREATE POLICY "Owner or Admin Manage Post" 
ON posts FOR ALL 
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo'))
);

-- 5. POLÍTICAS DE ADMIN LOGS
-- Solo Admins pueden leer/escribir.
CREATE POLICY "Admin All Access Logs" 
ON admin_logs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'ceo', 'institutional')
    )
);

-- 6. POLÍTICAS DE NOTIFICACIONES (Privadas)
-- Solo el dueño ve sus notificaciones.
CREATE POLICY "My Notifications" 
ON notifications
FOR ALL
USING (auth.uid() = user_id);

-- Insertar notificaciones (Trigger o Sistema puede insertar a cualquiera)
-- Permitimos que cualquier usuario autenticado GENERE una notificación para otro (ej: likes)
CREATE POLICY "Insert Notifications" 
ON notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 7. SINCRONIZACIÓN DE ROLES (Trigger de Seguridad)
-- Asegura que auth.users siempre esté al día
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

DO $$
BEGIN
    RAISE NOTICE '✅ RLS Final y Seguro Aplicado.';
END $$;
