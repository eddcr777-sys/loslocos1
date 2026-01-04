-- ==============================================================================
-- 🏰 ARQUITECTURA DE SEGURIDAD "UNIFEED" - ROLES Y PERMISOS AVANZADOS
-- ==============================================================================

-- 1. FUNCIONES AUXILIARES (Para verificar roles rápidamente)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type IN ('admin', 'ceo')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_institutional()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'institutional'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. TABLA POSTS (El corazón de la red social)
-- ==============================================================================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- LECTURA: Pública para todos (Soluciona quotes y feed)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);

-- CREACIÓN: Usuarios autenticados.
-- REGLA ESPECIAL: Solo Institucionales/Admins pueden crear posts OFICIALES (is_official = true)
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND (
    is_official = false OR 
    (is_official = true AND (public.is_institutional() OR public.is_admin()))
  )
);

-- EDICIÓN: El dueño puede editar. Los ADMINS también pueden editar cualquier post.
DROP POLICY IF EXISTS "Users can update posts" ON posts;
CREATE POLICY "Users can update posts" ON public.posts FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());

-- ELIMINACIÓN: El dueño puede borrar. Los ADMINS pueden borrar cualquier post (Moderación).
DROP POLICY IF EXISTS "Users can delete posts" ON posts;
CREATE POLICY "Users can delete posts" ON public.posts FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 3. TABLA PROFILES (Perfiles)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- LECTURA: Pública
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- EDICIÓN: Solo el dueño.
-- NOTA: Bloquear cambio de rol se debe hacer con triggers, pero RLS previene editar perfiles ajenos.
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- INSERCIÓN: Al registrarse
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- 4. INTERACCIONES (Likes, Comments, Shares)
-- ==============================================================================
-- LIKES
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Likes always public" ON likes;
CREATE POLICY "Likes always public" ON public.likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth can like" ON likes;
CREATE POLICY "Auth can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Auth can unlike" ON likes;
CREATE POLICY "Auth can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- SHARES / REPOSTS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shares public" ON shares;
CREATE POLICY "Shares public" ON public.shares FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth can share" ON shares;
CREATE POLICY "Auth can share" ON public.shares FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Auth can unshare" ON shares;
CREATE POLICY "Auth can unshare" ON public.shares FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments public" ON comments;
CREATE POLICY "Comments public" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth can comment" ON comments;
CREATE POLICY "Auth can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admins pueden borrar comentarios ofensivos
DROP POLICY IF EXISTS "Owner or Admin delete comment" ON comments;
CREATE POLICY "Owner or Admin delete comment" ON public.comments FOR DELETE 
USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 5. TABLA FOLLOWERS (Seguidores)
-- ==============================================================================
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Followers public" ON followers;
CREATE POLICY "Followers public" ON public.followers FOR SELECT USING (true);
DROP POLICY IF EXISTS "User follow" ON followers;
CREATE POLICY "User follow" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "User unfollow" ON followers;
CREATE POLICY "User unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- ==============================================================================
-- 6. DATOS PRIVADOS (Notificaciones, Settings)
-- ==============================================================================
-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Solo ver mis propias notificaciones
DROP POLICY IF EXISTS "My notifications" ON notifications;
CREATE POLICY "My notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
-- Permitir que el sistema (o acciones de usuarios) inserten notificaciones para otros
DROP POLICY IF EXISTS "Insert notifications" ON notifications;
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
-- Marcar como leída
DROP POLICY IF EXISTS "Update my notifications" ON notifications;
CREATE POLICY "Update my notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- SETTINGS (Configuraciones)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "My settings" ON user_settings;
CREATE POLICY "My settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update my settings" ON user_settings;
CREATE POLICY "Update my settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Insert my settings" ON user_settings;
CREATE POLICY "Insert my settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 7. STORIES (Historias)
-- ==============================================================================
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stories public" ON stories;
CREATE POLICY "Stories public" ON public.stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Create story" ON stories;
CREATE POLICY "Create story" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admins pueden borrar historias inapropiadas
DROP POLICY IF EXISTS "Delete story" ON stories;
CREATE POLICY "Delete story" ON public.stories FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 8. PROTECCIÓN DE ROL (Trigger para evitar auto-promoción)
-- ==============================================================================
-- Esta función evita que un usuario edite su propio 'user_type'
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario intenta cambiar su rol y NO es un admin
  IF NEW.user_type <> OLD.user_type AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'No tienes permisos para cambiar tu rol de usuario.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_user_role ON public.profiles;
CREATE TRIGGER tr_protect_user_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_role();

