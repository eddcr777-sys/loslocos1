-- Este script crea las foreign keys que faltan en tu base de datos
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar y crear FK de posts.user_id -> profiles.id
DO $$ 
BEGIN
    -- Eliminar FK existente si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_user_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE public.posts DROP CONSTRAINT posts_user_id_fkey;
    END IF;

    -- Crear la FK
    ALTER TABLE public.posts 
    ADD CONSTRAINT posts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
END $$;

-- 2. Verificar y crear FK de posts.original_post_id -> posts.id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_original_post_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE public.posts DROP CONSTRAINT posts_original_post_id_fkey;
    END IF;

    ALTER TABLE public.posts 
    ADD CONSTRAINT posts_original_post_id_fkey 
    FOREIGN KEY (original_post_id) 
    REFERENCES public.posts(id) 
    ON DELETE SET NULL;
END $$;

-- 3. Verificar y crear FK de shares.user_id -> profiles.id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'shares_user_id_fkey' 
        AND table_name = 'shares'
    ) THEN
        ALTER TABLE public.shares DROP CONSTRAINT shares_user_id_fkey;
    END IF;

    ALTER TABLE public.shares 
    ADD CONSTRAINT shares_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
END $$;

-- 4. Verificar y crear FK de shares.post_id -> posts.id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'shares_post_id_fkey' 
        AND table_name = 'shares'
    ) THEN
        ALTER TABLE public.shares DROP CONSTRAINT shares_post_id_fkey;
    END IF;

    ALTER TABLE public.shares 
    ADD CONSTRAINT shares_post_id_fkey 
    FOREIGN KEY (post_id) 
    REFERENCES public.posts(id) 
    ON DELETE CASCADE;
END $$;

-- 5. Verificar y crear FK de comments.user_id -> profiles.id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_user_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE public.comments DROP CONSTRAINT comments_user_id_fkey;
    END IF;

    ALTER TABLE public.comments 
    ADD CONSTRAINT comments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
END $$;

-- 6. Verificar y crear FK de comments.post_id -> posts.id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_post_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE public.comments DROP CONSTRAINT comments_post_id_fkey;
    END IF;

    ALTER TABLE public.comments 
    ADD CONSTRAINT comments_post_id_fkey 
    FOREIGN KEY (post_id) 
    REFERENCES public.posts(id) 
    ON DELETE CASCADE;
END $$;

-- 7. Verificar y crear FK de likes.user_id -> profiles.id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_user_id_fkey' 
        AND table_name = 'likes'
    ) THEN
        ALTER TABLE public.likes DROP CONSTRAINT likes_user_id_fkey;
    END IF;

    ALTER TABLE public.likes 
    ADD CONSTRAINT likes_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
END $$;

-- 8. Verificar y crear FK de likes.post_id -> posts.id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_post_id_fkey' 
        AND table_name = 'likes'
    ) THEN
        ALTER TABLE public.likes DROP CONSTRAINT likes_post_id_fkey;
    END IF;

    ALTER TABLE public.likes 
    ADD CONSTRAINT likes_post_id_fkey 
    FOREIGN KEY (post_id) 
    REFERENCES public.posts(id) 
    ON DELETE CASCADE;
END $$;

-- 9. IMPORTANTE: Refrescar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- Verificar que todas las FKs se crearon correctamente
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('posts', 'shares', 'comments', 'likes')
ORDER BY tc.table_name, tc.constraint_name;
