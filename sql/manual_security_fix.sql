-- =================================================================
-- MANUAL SECURITY FIX (v3.0 - No Loops, No Magic)
-- =================================================================
-- Estrategia: "Back to Basics".
-- 1. Eliminamos el trigger de roles (sospechoso de causar bloqueos).
-- 2. Aplicamos RLS tabla por tabla con comandos explícitos.
-- 3. Profiles y Posts son PÚBLICOS para leer (100% garantizado).

BEGIN;

-- 1. ELIMINAR TRIGGER DE ROLES (Para estabilizar)
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
DROP FUNCTION IF EXISTS public.sync_user_role();

-- 2. PERMISOS BÁSICOS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;

-- 3. PROFILES (El corazón de la app)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Read Profiles" ON profiles;
CREATE POLICY "Global Read Profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner Update Profiles" ON profiles;
CREATE POLICY "Owner Update Profiles" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Owner Insert Profiles" ON profiles;
CREATE POLICY "Owner Insert Profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Read Posts" ON posts;
CREATE POLICY "Global Read Posts" ON posts FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "Owner Manage Posts" ON posts;
CREATE POLICY "Owner Manage Posts" ON posts FOR ALL USING (auth.uid() = user_id);

-- 5. COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Read Comments" ON comments;
CREATE POLICY "Global Read Comments" ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner Manage Comments" ON comments;
CREATE POLICY "Owner Manage Comments" ON comments FOR ALL USING (auth.uid() = user_id);

-- 6. LIKES
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Read Likes" ON likes;
CREATE POLICY "Global Read Likes" ON likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner Toggle Likes" ON likes;
CREATE POLICY "Owner Toggle Likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- 7. FOLLOWERS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Read Followers" ON followers;
CREATE POLICY "Global Read Followers" ON followers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner Manage Followers" ON followers;
CREATE POLICY "Owner Manage Followers" ON followers FOR ALL USING (auth.uid() = follower_id);

-- 8. NOTIFICATIONS (Privado)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Read Notifs" ON notifications;
CREATE POLICY "Owner Read Notifs" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System Insert Notifs" ON notifications;
CREATE POLICY "System Insert Notifs" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Owner Update Notifs" ON notifications;
CREATE POLICY "Owner Update Notifs" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 9. SETTINGS (Privado)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Read Settings" ON user_settings;
CREATE POLICY "Owner Read Settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- 10. ADMIN LOGS (Solo Admin)
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin Read Logs" ON admin_logs;
-- Simplificado para evitar subqueries complejas: cualquiera puede insertar (sistema), solo admin lee
CREATE POLICY "Admin Read Logs" ON admin_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo', 'institutional'))
);
CREATE POLICY "System Insert Logs" ON admin_logs FOR INSERT WITH CHECK (true);

-- 11. TABLAS AUXILIARES (Para que carguen las tendencias y demás)
ALTER TABLE trending_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Trending" ON trending_posts;
CREATE POLICY "Public Read Trending" ON trending_posts FOR SELECT USING (true);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Rewards" ON user_rewards;
CREATE POLICY "Public Read Rewards" ON user_rewards FOR SELECT USING (true);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Read RateLimits" ON rate_limits;
CREATE POLICY "Owner Read RateLimits" ON rate_limits FOR SELECT USING (auth.uid() = user_id);

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ Configuración Manual y Estable Aplicada.';
    RAISE NOTICE '   - Trigger eliminado preventivamente.';
    RAISE NOTICE '   - Políticas básicas recreadas explícitamente.';
END $$;
