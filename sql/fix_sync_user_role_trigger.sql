-- ============================================
-- CORRECCIÓN DEL TRIGGER sync_user_role_to_auth
-- ============================================
-- Este script corrige el error en el trigger que sincroniza
-- el user_type de profiles con los metadatos de auth.users

-- 1. ELIMINAR LOS TRIGGERS Y LA FUNCIÓN INCORRECTOS
-- Usar CASCADE para eliminar dependencias automáticamente
DROP TRIGGER IF EXISTS sync_user_role_trigger ON profiles CASCADE;
DROP TRIGGER IF EXISTS on_profile_role_update ON profiles CASCADE;
DROP FUNCTION IF EXISTS sync_user_role_to_auth() CASCADE;

-- 2. CREAR LA FUNCIÓN CORRECTA
-- La columna correcta es raw_app_meta_data (no raw_app_metadata_content)
CREATE OR REPLACE FUNCTION sync_user_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar los metadatos de autenticación con el user_type
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{user_type}',
        to_jsonb(NEW.user_type)
    )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR EL TRIGGER CORREGIDO (usando el nombre original)
CREATE TRIGGER on_profile_role_update
AFTER INSERT OR UPDATE OF user_type ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_to_auth();

-- 4. SINCRONIZAR TODOS LOS user_type EXISTENTES
-- Esto asegura que todos los usuarios existentes tengan su user_type en los metadatos
UPDATE auth.users u
SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{user_type}',
    to_jsonb(p.user_type)
)
FROM profiles p
WHERE u.id = p.id
AND (
    u.raw_app_meta_data->>'user_type' IS NULL 
    OR u.raw_app_meta_data->>'user_type' != p.user_type
);

-- 5. VERIFICAR QUE TODO ESTÉ CORRECTO
SELECT 
    p.id,
    p.full_name,
    p.user_type as profile_user_type,
    u.raw_app_meta_data->>'user_type' as auth_user_type,
    CASE 
        WHEN p.user_type = u.raw_app_meta_data->>'user_type' THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. MOSTRAR ESTADÍSTICAS
SELECT 
    'Total de usuarios' as descripcion,
    COUNT(*) as cantidad
FROM profiles
UNION ALL
SELECT 
    'Usuarios con user_type sincronizado',
    COUNT(*)
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.user_type = u.raw_app_meta_data->>'user_type'
UNION ALL
SELECT 
    'Usuarios con user_type desincronizado',
    COUNT(*)
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.user_type != COALESCE(u.raw_app_meta_data->>'user_type', 'common');
