-- ==============================================================================
-- 🛡️ SCRIPT MAESTRO DE SEGURIDAD (RLS) - UNIFEED
-- ==============================================================================
-- Este script habilita la seguridad en todas las tablas públicas vulnerables.
-- Garantiza que los usuarios solo puedan modificar sus propios datos,
-- pero mantiene la visibilidad pública necesaria para una red social.

-- ==============================================================================
-- 1. TABLA PROFILES (Perfiles de Usuario)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lectura: Todo el mundo puede ver perfiles (necesario para el feed)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Edición: Solo el dueño puede editar su perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Inserción: Usualmente lo maneja un trigger al registrarse, pero permitimos al usuario insertar su propio ID si es manual
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- 2. TABLA FOLLOWERS (Seguidores)
-- ==============================================================================
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Lectura: Pública (ver quién sigue a quién es parte de la red social)
DROP POLICY IF EXISTS "Followers are viewable by everyone" ON followers;
CREATE POLICY "Followers are viewable by everyone"
ON public.followers FOR SELECT
USING (true);

-- Seguir (Insert): Solo el usuario autenticado puede seguir a alguien (como él mismo)
DROP POLICY IF EXISTS "Users can follow others" ON followers;
CREATE POLICY "Users can follow others"
ON public.followers FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Dejar de seguir (Delete): Solo el usuario puede dejar de seguir
DROP POLICY IF EXISTS "Users can unfollow" ON followers;
CREATE POLICY "Users can unfollow"
ON public.followers FOR DELETE
USING (auth.uid() = follower_id);

-- ==============================================================================
-- 3. TABLA SHARES (Compartidos/Reposts)
-- ==============================================================================
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Lectura: Pública
DROP POLICY IF EXISTS "Shares are viewable by everyone" ON shares;
CREATE POLICY "Shares are viewable by everyone"
ON public.shares FOR SELECT
USING (true);

-- Crear Share: Solo el usuario autenticado
DROP POLICY IF EXISTS "Users can create shares" ON shares;
CREATE POLICY "Users can create shares"
ON public.shares FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Borrar Share: Solo el dueño
DROP POLICY IF EXISTS "Users can delete own shares" ON shares;
CREATE POLICY "Users can delete own shares"
ON public.shares FOR DELETE
USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. TABLA STORIES (Historias)
-- ==============================================================================
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Lectura: Pública (o podría restringirse a seguidores, pero por ahora Pública para evitar complejidad)
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON stories;
CREATE POLICY "Stories are viewable by everyone"
ON public.stories FOR SELECT
USING (true);

-- Crear Story: Solo el dueño
DROP POLICY IF EXISTS "Users can create stories" ON stories;
CREATE POLICY "Users can create stories"
ON public.stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Borrar Story: Solo el dueño
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
CREATE POLICY "Users can delete own stories"
ON public.stories FOR DELETE
USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. TABLA NOTIFICATIONS (⚠️ CRÍTICO: DATOS PRIVADOS)
-- ==============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Lectura: PRIVADA. Solo el receptor puede ver sus notificaciones.
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Actualizar (Marcar leída): Solo el receptor.
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Insertar: Generalmente el sistema (triggers) inserta notificaciones.
-- Pero permitimos que usuarios autenticados inserten si la lógica de negocio lo requiere,
-- aunque idealmente esto debería ser 'postgres' role via triggers.
-- Política: Users can insert notifications for others (e.g. creating a like notification)
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "Users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated'); 
-- Nota: Esto permite a cualquiera crear notificaciones, lo cual es necesario si no usas triggers de sistema puros.

-- ==============================================================================
-- 6. TABLAS YA CUBIERTAS (Recordatorio)
-- ==============================================================================
-- posts, likes, comments ya deberían tener RLS activado por trabajos anteriores.
-- Si tienes duda, ejecuta lo siguiente para asegurar 'posts':

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select on posts" ON posts;
CREATE POLICY "Allow all select on posts" ON public.posts FOR SELECT USING (true);
-- Las políticas de escritura (insert/update/delete) para posts ya deberían existir o restringirse al user_id.

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
