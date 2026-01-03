-- ============================================
-- VERIFICACIÓN Y CORRECCIÓN DE POLÍTICAS RLS
-- ============================================
-- Este script verifica que las políticas RLS no estén bloqueando
-- el acceso a los posts y perfiles después de eliminar la verificación

-- 1. VERIFICAR POLÍTICAS EN LA TABLA PROFILES
-- Asegurarse de que todos puedan ver todos los perfiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- 2. VERIFICAR POLÍTICAS EN LA TABLA POSTS
-- Asegurarse de que todos puedan ver todos los posts no eliminados
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
USING (deleted_at IS NULL);

-- 3. VERIFICAR POLÍTICAS EN LA TABLA SHARES
-- Asegurarse de que todos puedan ver todos los shares
DROP POLICY IF EXISTS "Shares are viewable by everyone" ON shares;
CREATE POLICY "Shares are viewable by everyone"
ON shares FOR SELECT
USING (true);

-- 4. VERIFICAR POLÍTICAS EN LA TABLA LIKES
-- Asegurarse de que todos puedan ver todos los likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
CREATE POLICY "Likes are viewable by everyone"
ON likes FOR SELECT
USING (true);

-- 5. VERIFICAR POLÍTICAS EN LA TABLA COMMENTS
-- Asegurarse de que todos puedan ver todos los comentarios
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
USING (true);

-- 6. VERIFICAR POLÍTICAS EN LA TABLA FOLLOWERS
-- Asegurarse de que todos puedan ver las relaciones de seguimiento
DROP POLICY IF EXISTS "Followers are viewable by everyone" ON followers;
CREATE POLICY "Followers are viewable by everyone"
ON followers FOR SELECT
USING (true);

-- 7. VERIFICAR QUE RLS ESTÉ HABILITADO PERO NO BLOQUEANDO
-- Mostrar todas las políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. VERIFICAR QUE EXISTAN DATOS EN LAS TABLAS
SELECT 
    'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'posts', COUNT(*) FROM posts WHERE deleted_at IS NULL
UNION ALL
SELECT 'shares', COUNT(*) FROM shares
UNION ALL
SELECT 'likes', COUNT(*) FROM likes
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'followers', COUNT(*) FROM followers;
