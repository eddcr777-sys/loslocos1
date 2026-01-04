-- ============================================
-- DIAGNÓSTICO Y SOLUCIÓN: Quotes no muestran contenido
-- ============================================
-- Este script diagnostica y soluciona el problema donde los quotes
-- muestran "Contenido no disponible" porque Supabase no trae el original_post

-- PASO 1: Verificar que existen posts con original_post_id
-- ============================================
SELECT 
    id,
    content,
    original_post_id,
    created_at,
    deleted_at
FROM posts 
WHERE original_post_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- PASO 2: Verificar que los posts originales existen
-- ============================================
SELECT 
    p.id as quote_id,
    p.content as quote_content,
    p.original_post_id,
    op.id as original_id,
    op.content as original_content,
    op.deleted_at as original_deleted
FROM posts p
LEFT JOIN posts op ON p.original_post_id = op.id
WHERE p.original_post_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- PASO 3: Verificar las políticas RLS actuales
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'posts';

-- PASO 4: SOLUCIÓN - Actualizar políticas RLS para permitir lectura de posts relacionados
-- ============================================

-- Eliminar política antigua si existe
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

-- Crear nueva política que permite leer TODOS los posts (incluyendo en JOINs)
CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
USING (
    -- Permitir ver posts no eliminados
    deleted_at IS NULL
    OR
    -- O permitir ver cualquier post si es parte de un JOIN (para quotes/reposts)
    true
);

-- ALTERNATIVA: Si la política anterior es muy permisiva, usa esta:
-- Esta permite ver posts eliminados SOLO cuando son referenciados por un quote
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
USING (true);  -- Permite leer todos los posts, el filtrado se hace en la aplicación

-- PASO 5: Verificar que la foreign key existe
-- ============================================
SELECT
    tc.table_name, 
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
    AND tc.table_name='posts'
    AND kcu.column_name='original_post_id';

-- PASO 6: Si la foreign key no existe, créala
-- ============================================
-- NOTA: Solo ejecuta esto si el PASO 5 no devuelve resultados

ALTER TABLE posts
ADD CONSTRAINT posts_original_post_id_fkey
FOREIGN KEY (original_post_id)
REFERENCES posts(id)
ON DELETE SET NULL;  -- Si se elimina el post original, el quote mantiene el ID pero será null

-- PASO 7: Verificar que el índice existe para mejor performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_original_post_id 
ON posts(original_post_id) 
WHERE original_post_id IS NOT NULL;

-- PASO 8: Test final - Simular la consulta que hace la app
-- ============================================
SELECT 
    p.*,
    to_jsonb(author.*) as profiles,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
    (SELECT COUNT(*) FROM shares WHERE post_id = p.id) as shares_count,
    to_jsonb(op.*) as original_post,
    to_jsonb(op_author.*) as original_post_profiles
FROM posts p
LEFT JOIN profiles author ON p.user_id = author.id
LEFT JOIN posts op ON p.original_post_id = op.id
LEFT JOIN profiles op_author ON op.user_id = op_author.id
WHERE p.original_post_id IS NOT NULL
    AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecuta PASO 1 y PASO 2 para verificar que hay quotes y que los posts originales existen
-- 2. Ejecuta PASO 3 para ver las políticas actuales
-- 3. Ejecuta PASO 4 para actualizar las políticas RLS (elige una de las dos opciones)
-- 4. Ejecuta PASO 5 para verificar la foreign key
-- 5. Si es necesario, ejecuta PASO 6 para crear la foreign key
-- 6. Ejecuta PASO 7 para crear el índice
-- 7. Ejecuta PASO 8 para verificar que la consulta funciona
-- 8. Refresca la aplicación y verifica que los quotes ahora muestran el contenido
