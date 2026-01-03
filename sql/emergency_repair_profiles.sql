-- ============================================
-- SCRIPT DE EMERGENCIA: REPARAR PERFIL DE USUARIO
-- ============================================
-- Este script verifica y repara el perfil del usuario actual

-- PASO 1: Ver todos los usuarios y sus estados
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    u.raw_app_meta_data->>'user_type' as auth_user_type,
    p.id as profile_id,
    p.full_name,
    p.username,
    p.user_type as profile_user_type,
    p.avatar_url,
    p.created_at as profile_created,
    CASE 
        WHEN p.id IS NULL THEN '❌ SIN PERFIL'
        WHEN p.full_name IS NULL OR p.full_name = '' THEN '⚠️ PERFIL INCOMPLETO'
        WHEN p.user_type IS NULL THEN '⚠️ SIN USER_TYPE'
        ELSE '✅ OK'
    END as estado
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- PASO 2: Crear perfiles faltantes para usuarios que no tienen
INSERT INTO profiles (id, full_name, username, user_type, avatar_url, bio)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    COALESCE(u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1)),
    COALESCE(u.raw_app_meta_data->>'user_type', 'common'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || u.id,
    ''
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Actualizar perfiles incompletos
UPDATE profiles
SET 
    full_name = COALESCE(NULLIF(full_name, ''), 'Usuario'),
    username = COALESCE(NULLIF(username, ''), 'user_' || SUBSTRING(id::text, 1, 8)),
    user_type = COALESCE(user_type, 'common'),
    avatar_url = COALESCE(NULLIF(avatar_url, ''), 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id),
    bio = COALESCE(bio, '')
WHERE 
    full_name IS NULL 
    OR full_name = '' 
    OR username IS NULL 
    OR username = ''
    OR user_type IS NULL
    OR avatar_url IS NULL
    OR avatar_url = '';

-- PASO 4: Sincronizar user_type de profiles a auth.users
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

-- PASO 5: Verificar estado final
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.username,
    p.user_type as profile_user_type,
    u.raw_app_meta_data->>'user_type' as auth_user_type,
    CASE 
        WHEN p.user_type = u.raw_app_meta_data->>'user_type' THEN '✅ SINCRONIZADO'
        ELSE '❌ DESINCRONIZADO'
    END as sync_status,
    CASE 
        WHEN p.full_name IS NOT NULL AND p.username IS NOT NULL AND p.user_type IS NOT NULL THEN '✅ COMPLETO'
        ELSE '❌ INCOMPLETO'
    END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- PASO 6: Contar registros en cada tabla
SELECT 
    'profiles' as tabla,
    COUNT(*) as total
FROM profiles
UNION ALL
SELECT 'posts', COUNT(*) FROM posts WHERE deleted_at IS NULL
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'likes', COUNT(*) FROM likes
UNION ALL
SELECT 'shares', COUNT(*) FROM shares
UNION ALL
SELECT 'followers', COUNT(*) FROM followers
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- PASO 7: Mostrar últimos posts con sus autores
SELECT 
    p.id,
    p.content,
    p.created_at,
    pr.full_name as author,
    pr.user_type,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- MENSAJE FINAL
DO $$
DECLARE
    total_users INTEGER;
    total_profiles INTEGER;
    total_posts INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(*) INTO total_posts FROM posts WHERE deleted_at IS NULL;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'REPARACIÓN COMPLETADA';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total de usuarios: %', total_users;
    RAISE NOTICE 'Total de perfiles: %', total_profiles;
    RAISE NOTICE 'Total de posts: %', total_posts;
    RAISE NOTICE '';
    RAISE NOTICE 'Ahora ejecuta: sql/disable_rls_for_diagnosis.sql';
    RAISE NOTICE '============================================';
END $$;
