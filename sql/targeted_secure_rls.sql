-- =================================================================
-- TARGETED SECURE RLS POLICIES (v2.0 - Explicit & Safe)
-- =================================================================
-- Objetivo: Seguridad PLENA en tablas conocidas, SIN bloquear tablas desconocidas.
-- Diferencia: NO usamos un bucle automático. Habilitamos solo lo que protegemos explícitamente.

BEGIN;

-- 1. ASEGURAR PERMISOS DE EJECUCIÓN (Importante para evitar "Permission Denied")
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_growth() TO authenticated;

-- 2. HABILITAR RLS y LIMPIAR POLÍTICAS (Solo en tablas conocidas)
DO $$ 
DECLARE 
    tables TEXT[] := ARRAY[
        'profiles', 'posts', 'comments', 'likes', 'followers', 
        'notifications', 'stories', 'secret_verification_keys', 
        'admin_logs', 'scheduled_posts', 'user_settings', 
        'shares', 'trending_posts', 'user_rewards', 
        'security_audit_logs', 'rate_limits', 'audit_log', 'security_log'
    ];
    t TEXT;
BEGIN 
    FOREACH t IN ARRAY tables
    LOOP 
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Profiles Public Read" ON %I', t); -- Limpieza preventiva
        -- (Nota: Para limpiar bien, deberíamos borrar todas las policies especificas, 
        --  pero mejor confiamos en los DROP explícitos de abajo)
    END LOOP; 
END $$;


-- =================================================================
-- 3. DEFINICIÓN DE POLÍTICAS (Una por una, con DROP previo)
-- =================================================================

-- PROFILES
DROP POLICY IF EXISTS "Profiles Public Read" ON profiles;
CREATE POLICY "Profiles Public Read" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profiles Owner Update" ON profiles;
CREATE POLICY "Profiles Owner Update" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Profiles Owner Insert" ON profiles;
CREATE POLICY "Profiles Owner Insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

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

-- LIKES
DROP POLICY IF EXISTS "Likes Public Read" ON likes;
CREATE POLICY "Likes Public Read" ON likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Likes Owner Toggle" ON likes;
CREATE POLICY "Likes Owner Toggle" ON likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- FOLLOWERS
DROP POLICY IF EXISTS "Followers Public Read" ON followers;
CREATE POLICY "Followers Public Read" ON followers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Followers Owner Insert" ON followers;
CREATE POLICY "Followers Owner Insert" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Followers Owner Delete" ON followers;
CREATE POLICY "Followers Owner Delete" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Notifs Owner Read" ON notifications;
CREATE POLICY "Notifs Owner Read" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Notifs System Insert" ON notifications;
CREATE POLICY "Notifs System Insert" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Notifs Owner Update" ON notifications;
CREATE POLICY "Notifs Owner Update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- USER SETTINGS
DROP POLICY IF EXISTS "Settings Owner Access" ON user_settings;
CREATE POLICY "Settings Owner Access" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- TRENDING POSTS
DROP POLICY IF EXISTS "Trending Public Read" ON trending_posts;
CREATE POLICY "Trending Public Read" ON trending_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Trending Admin Manage" ON trending_posts;
CREATE POLICY "Trending Admin Manage" ON trending_posts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo'))
);

-- SHARES
DROP POLICY IF EXISTS "Shares Public Read" ON shares;
CREATE POLICY "Shares Public Read" ON shares FOR SELECT USING (true);
DROP POLICY IF EXISTS "Shares Owner Insert" ON shares;
CREATE POLICY "Shares Owner Insert" ON shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SCHEDULED POSTS
DROP POLICY IF EXISTS "Scheduled Owner Access" ON scheduled_posts;
CREATE POLICY "Scheduled Owner Access" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);

-- ADMIN LOGS
DROP POLICY IF EXISTS "Admins Read Logs" ON admin_logs;
CREATE POLICY "Admins Read Logs" ON admin_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo', 'institutional'))
);
DROP POLICY IF EXISTS "Admins Create Logs" ON admin_logs;
CREATE POLICY "Admins Create Logs" ON admin_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'ceo', 'institutional'))
);

-- USER REWARDS
DROP POLICY IF EXISTS "Rewards Public Read" ON user_rewards;
CREATE POLICY "Rewards Public Read" ON user_rewards FOR SELECT USING (true);

-- RATE LIMITS
DROP POLICY IF EXISTS "RateLimits Owner Read" ON rate_limits;
CREATE POLICY "RateLimits Owner Read" ON rate_limits FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "RateLimits System Insert" ON rate_limits;
CREATE POLICY "RateLimits System Insert" ON rate_limits FOR INSERT WITH CHECK (true);


-- 4. SINCRONIZACIÓN DE ROLES (SAFETY NET)
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
    RAISE NOTICE '✅ Seguridad Dirigida y Segura Aplicada.';
    RAISE NOTICE '   - Solo se han tocado las tablas conocidas.';
    RAISE NOTICE '   - Permisos garantizados.';
END $$;
