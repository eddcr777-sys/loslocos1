-- ==============================================================================
-- 🛡️ SCRIPT DE SEGURIDAD V2 (LIMPIEZA TOTAL Y REINICIO)
-- ==============================================================================

-- 1. FUNCIONES DE ROLES (Admin / Institucional)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica si el usuario actual es admin o ceo
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type IN ('admin', 'ceo')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER es vital para que funcione siempre

CREATE OR REPLACE FUNCTION public.is_institutional()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'institutional'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. LIMPIEZA PROFUNDA (Borrar TODAS las políticas existentes)
-- ------------------------------------------------------------------------------
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- Recorre todas las políticas de nuestras tablas y las borra una por una
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('posts', 'profiles', 'likes', 'comments', 'shares', 'followers', 'notifications', 'stories', 'user_settings')
    ) LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename); 
    END LOOP; 
END $$;


-- 3. HABILITAR RLS EN TODAS LAS TABLAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;


-- 4. POLÍTICAS: POSTS (Público ver, Duo/Admin editar)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);

CREATE POLICY "Auth Create Posts" ON public.posts FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' AND (
        is_official = false OR 
        (is_official = true AND (public.is_institutional() OR public.is_admin()))
    )
);

CREATE POLICY "Owner/Admin Edit Posts" ON public.posts FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Owner/Admin Delete Posts" ON public.posts FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());


-- 5. POLÍTICAS: PROFILES (Público ver, Dueño editar)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Owner Edit Profile" ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Permitimos insertarse a uno mismo al registrarse
CREATE POLICY "Owner Insert Profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 6. POLÍTICAS: SOCIAL (Likes, Shares, Followers) - Público ver, Dueño actuar
-- ------------------------------------------------------------------------------
-- LIKES
CREATE POLICY "Public Read Likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Auth Create Like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner Delete Like" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- SHARES
CREATE POLICY "Public Read Shares" ON public.shares FOR SELECT USING (true);
CREATE POLICY "Auth Create Share" ON public.shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner Delete Share" ON public.shares FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWERS
CREATE POLICY "Public Read Followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Auth Create Follow" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Owner Delete Follow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);


-- 7. POLÍTICAS: COMENTARIOS (Público ver, Admin moderar)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public Read Comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth Create Comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner/Admin Delete Comment" ON public.comments FOR DELETE 
USING (auth.uid() = user_id OR public.is_admin());


-- 8. POLÍTICAS: STORIES (Historias)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public Read Stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Auth Create Story" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner/Admin Delete Story" ON public.stories FOR DELETE 
USING (auth.uid() = user_id OR public.is_admin());


-- 9. POLÍTICAS: PRIVADAS (Notificaciones y Settings)
-- ------------------------------------------------------------------------------
-- NOTIFICATIONS: Solo el usuario ve las suyas
CREATE POLICY "Me Read Notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Me Update Notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
-- Permitimos que cualquiera inserte una notificación (ej: alguien te dio like)
CREATE POLICY "Auth Insert Notification" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SETTINGS: Privado
CREATE POLICY "Me Read Settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Me Edit Settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Me Insert Settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- FIN DEL SCRIPT: AHORA TODO DEBERÍA FUNCIONAR SIN "CONTENIDO NO DISPONIBLE"
-- ==============================================================================
