-- =================================================================
-- COMPREHENSIVE SAFE RLS POLICIES (v1.1 - Idempotent & Full Schema)
-- =================================================================
-- Objetivo: Seguridad total sin recursión, re-ejecutable sin errores.
 
BEGIN;

-- =================================================================
-- 1. LIMPIEZA GENÉRICA (Solo para asegurar estado limpio)
-- =================================================================
DO $$ 
DECLARE 
    t text; 
BEGIN 
    -- Solo iterar sobre TABLAS REALES (BASE TABLE)
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP 
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t); 
    END LOOP; 
END $$;


-- =================================================================
-- 2. POLÍTICAS DE IDENTIDAD (PROFILES)
-- =================================================================
DROP POLICY IF EXISTS "Profiles Public Read" ON profiles;
CREATE POLICY "Profiles Public Read" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles Owner Update" ON profiles;
CREATE POLICY "Profiles Owner Update" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles Owner Insert" ON profiles;
CREATE POLICY "Profiles Owner Insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- =================================================================
-- 3. CONTENIDO PÚBLICO (POSTS, COMMENTS, SHARES, LIKES)
-- =================================================================
-- POSTS
DROP POLICY IF EXISTS "Posts Public Read" ON posts;
CREATE POLICY "Posts Public Read" ON posts FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Posts Owner Insert" ON posts;
CREATE POLICY "Posts Owner Insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Posts Owner Manage" ON posts;
CREATE POLICY "Posts Owner Manage" ON posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Posts Owner Delete" ON posts;
CREATE POLICY "Posts Owner Delete" ON posts FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS
DROP POLICY IF EXISTS "Comments Public Read" ON comments;
CREATE POLICY "Comments Public Read" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Comments Owner Insert" ON comments;
CREATE POLICY "Comments Owner Insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Comments Owner Delete" ON comments;
CREATE POLICY "Comments Owner Delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- SHARES
DROP POLICY IF EXISTS "Shares Public Read" ON shares;
CREATE POLICY "Shares Public Read" ON shares FOR SELECT USING (true);

DROP POLICY IF EXISTS "Shares Owner Insert" ON shares;
CREATE POLICY "Shares Owner Insert" ON shares FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Shares Owner Delete" ON shares;
CREATE POLICY "Shares Owner Delete" ON shares FOR DELETE USING (auth.uid() = user_id);

-- LIKES
DROP POLICY IF EXISTS "Likes Public Read" ON likes;
CREATE POLICY "Likes Public Read" ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Likes Owner Toggle" ON likes;
CREATE POLICY "Likes Owner Toggle" ON likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- =================================================================
-- 4. SOCIAL (FOLLOWERS)
-- =================================================================
DROP POLICY IF EXISTS "Followers Public Read" ON followers;
CREATE POLICY "Followers Public Read" ON followers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Followers Owner Insert" ON followers;
CREATE POLICY "Followers Owner Insert" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Followers Owner Delete" ON followers;
CREATE POLICY "Followers Owner Delete" ON followers FOR DELETE USING (auth.uid() = follower_id);


-- =================================================================
-- 5. CONFIGURACIÓN Y PRIVACIDAD (SETTINGS, NOTIFICATIONS, SCHEDULED)
-- =================================================================
-- SETTINGS
DROP POLICY IF EXISTS "Settings Owner Access" ON user_settings;
CREATE POLICY "Settings Owner Access" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Notifs Owner Read" ON notifications;
CREATE POLICY "Notifs Owner Read" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notifs System Insert" ON notifications;
CREATE POLICY "Notifs System Insert" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Notifs Owner Update" ON notifications;
CREATE POLICY "Notifs Owner Update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- SCHEDULED POSTS
DROP POLICY IF EXISTS "Scheduled Owner Access" ON scheduled_posts;
CREATE POLICY "Scheduled Owner Access" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);


-- =================================================================
-- 6. ADMINISTRACIÓN (LOGS, KEYS, SECURITY)
-- =================================================================
-- ADMIN LOGS
DROP POLICY IF EXISTS "Admins Read Logs" ON admin_logs;
CREATE POLICY "Admins Read Logs" ON admin_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo', 'institutional'))
);

DROP POLICY IF EXISTS "Admins Create Logs" ON admin_logs;
CREATE POLICY "Admins Create Logs" ON admin_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo', 'institutional'))
);

-- SECRET KEYS
DROP POLICY IF EXISTS "Admins Manage Keys" ON secret_verification_keys;
CREATE POLICY "Admins Manage Keys" ON secret_verification_keys FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo'))
);

-- SECURITY AUDIT
DROP POLICY IF EXISTS "CEO Read Security" ON security_audit_logs;
CREATE POLICY "CEO Read Security" ON security_audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('ceo', 'admin'))
);


-- =================================================================
-- 7. TABLAS AUXILIARES (TRENDING, REWARDS, SECURITY)
-- =================================================================
-- TRENDING
DROP POLICY IF EXISTS "Trending Public Read" ON trending_posts;
CREATE POLICY "Trending Public Read" ON trending_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trending Admin Manage" ON trending_posts;
CREATE POLICY "Trending Admin Manage" ON trending_posts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo'))
);

-- USER REWARDS
DROP POLICY IF EXISTS "Rewards Public Read" ON user_rewards;
CREATE POLICY "Rewards Public Read" ON user_rewards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Rewards Admin Manage" ON user_rewards;
CREATE POLICY "Rewards Admin Manage" ON user_rewards FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo', 'institutional'))
);

-- RATE LIMITS
DROP POLICY IF EXISTS "RateLimits Owner Read" ON rate_limits;
CREATE POLICY "RateLimits Owner Read" ON rate_limits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "RateLimits System Insert" ON rate_limits;
CREATE POLICY "RateLimits System Insert" ON rate_limits FOR INSERT WITH CHECK (true);

-- SECURITY LOGS (Additional tables)
DROP POLICY IF EXISTS "Audit Log Admin Read" ON audit_log;
CREATE POLICY "Audit Log Admin Read" ON audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo'))
);

DROP POLICY IF EXISTS "Security Log CEO Read" ON security_log;
CREATE POLICY "Security Log CEO Read" ON security_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('ceo', 'admin'))
);


-- =================================================================
-- 8. SINCRONIZACIÓN DE ROLES (SAFETY NET)
-- =================================================================
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
    RAISE NOTICE '✅ Sistema de Seguridad Completo (Idempotente) Aplicado.';
END $$;
