-- ============================================
-- CORRECCIÓN COMPLETA DE POLÍTICAS RLS
-- ============================================
-- Este script corrige las políticas de seguridad que están bloqueando
-- el acceso a los datos de la aplicación

-- PASO 1: VERIFICAR ESTADO ACTUAL DE RLS
-- Ver qué tablas tienen RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- PASO 2: DESHABILITAR RLS TEMPORALMENTE PARA DIAGNÓSTICO
-- (Esto nos ayudará a confirmar que RLS es el problema)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE followers DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- PASO 3: VERIFICAR QUE HAY DATOS EN LAS TABLAS
SELECT 
    'profiles' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN user_type = 'common' THEN 1 END) as common_users,
    COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN user_type = 'ceo' THEN 1 END) as ceo_users,
    COUNT(CASE WHEN user_type = 'institutional' THEN 1 END) as institutional_users,
    COUNT(CASE WHEN user_type = 'popular' THEN 1 END) as popular_users
FROM profiles
UNION ALL
SELECT 
    'posts',
    COUNT(*),
    COUNT(CASE WHEN deleted_at IS NULL THEN 1 END),
    COUNT(CASE WHEN is_official = true THEN 1 END),
    NULL, NULL, NULL
FROM posts
UNION ALL
SELECT 
    'comments',
    COUNT(*),
    NULL, NULL, NULL, NULL, NULL
FROM comments
UNION ALL
SELECT 
    'likes',
    COUNT(*),
    NULL, NULL, NULL, NULL, NULL
FROM likes
UNION ALL
SELECT 
    'shares',
    COUNT(*),
    NULL, NULL, NULL, NULL, NULL
FROM shares
UNION ALL
SELECT 
    'followers',
    COUNT(*),
    NULL, NULL, NULL, NULL, NULL
FROM followers
UNION ALL
SELECT 
    'notifications',
    COUNT(*),
    COUNT(CASE WHEN read = false THEN 1 END),
    NULL, NULL, NULL, NULL
FROM notifications;

-- PASO 4: VERIFICAR PERFILES ESPECÍFICOS
-- Mostrar los últimos 5 perfiles creados
SELECT 
    id,
    full_name,
    username,
    user_type,
    avatar_url,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- PASO 5: VERIFICAR POSTS
-- Mostrar los últimos 5 posts
SELECT 
    p.id,
    p.content,
    p.created_at,
    p.deleted_at,
    pr.full_name as author_name,
    pr.user_type as author_type
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC
LIMIT 5;

-- PASO 6: MENSAJE PARA EL USUARIO
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RLS DESHABILITADO TEMPORALMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Ahora intenta recargar tu aplicación (Ctrl+F5)';
    RAISE NOTICE 'Si los datos aparecen, confirma que RLS era el problema';
    RAISE NOTICE 'Luego ejecuta el script: enable_rls_with_correct_policies.sql';
    RAISE NOTICE '============================================';
END $$;
