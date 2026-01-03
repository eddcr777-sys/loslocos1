-- ============================================
-- HABILITAR RLS CON POLÍTICAS CORRECTAS
-- ============================================
-- Este script re-habilita RLS con políticas que permiten
-- el acceso correcto a los datos

-- PASO 1: HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- PASO 2: ELIMINAR POLÍTICAS ANTIGUAS QUE PUEDAN ESTAR BLOQUEANDO
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

DROP POLICY IF EXISTS "Shares are viewable by everyone" ON shares;
DROP POLICY IF EXISTS "Users can create shares" ON shares;
DROP POLICY IF EXISTS "Users can delete own shares" ON shares;

DROP POLICY IF EXISTS "Followers are viewable by everyone" ON followers;
DROP POLICY IF EXISTS "Users can follow others" ON followers;
DROP POLICY IF EXISTS "Users can unfollow" ON followers;

DROP POLICY IF EXISTS "Notifications are viewable by owner" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

DROP POLICY IF EXISTS "Stories are viewable by everyone" ON stories;
DROP POLICY IF EXISTS "Users can create stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

-- PASO 3: CREAR POLÍTICAS CORRECTAS PARA PROFILES
CREATE POLICY "Enable read access for all users"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- PASO 4: CREAR POLÍTICAS CORRECTAS PARA POSTS
CREATE POLICY "Enable read access for all users"
ON posts FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Enable insert for authenticated users only"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- PASO 5: CREAR POLÍTICAS CORRECTAS PARA COMMENTS
CREATE POLICY "Enable read access for all users"
ON comments FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- PASO 6: CREAR POLÍTICAS CORRECTAS PARA LIKES
CREATE POLICY "Enable read access for all users"
ON likes FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- PASO 7: CREAR POLÍTICAS CORRECTAS PARA SHARES
CREATE POLICY "Enable read access for all users"
ON shares FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON shares FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
ON shares FOR DELETE
USING (auth.uid() = user_id);

-- PASO 8: CREAR POLÍTICAS CORRECTAS PARA FOLLOWERS
CREATE POLICY "Enable read access for all users"
ON followers FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON followers FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Enable delete for users based on follower_id"
ON followers FOR DELETE
USING (auth.uid() = follower_id);

-- PASO 9: CREAR POLÍTICAS CORRECTAS PARA NOTIFICATIONS
CREATE POLICY "Enable read access for notification owner"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for all authenticated users"
ON notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for notification owner"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- PASO 10: CREAR POLÍTICAS CORRECTAS PARA STORIES
CREATE POLICY "Enable read access for all users"
ON stories FOR SELECT
USING (expires_at > NOW());

CREATE POLICY "Enable insert for authenticated users only"
ON stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
ON stories FOR DELETE
USING (auth.uid() = user_id);

-- PASO 11: VERIFICAR POLÍTICAS CREADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- PASO 12: MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RLS HABILITADO CON POLÍTICAS CORRECTAS';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Recarga tu aplicación (Ctrl+F5)';
    RAISE NOTICE 'Ahora deberías ver todos los datos correctamente';
    RAISE NOTICE '============================================';
END $$;
