-- =================================================================
-- REFACTOR: QUOTES TO SEPARATE TABLE
-- =================================================================

BEGIN;

-- 1. Create Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_official BOOLEAN DEFAULT false
);

-- 2. Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Quotes Public Read" ON quotes;
CREATE POLICY "Quotes Public Read" ON quotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Quotes Owner Insert" ON quotes;
CREATE POLICY "Quotes Owner Insert" ON quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Quotes Owner Delete" ON quotes;
CREATE POLICY "Quotes Owner Delete" ON quotes FOR DELETE USING (auth.uid() = user_id);

-- 4. Migration: Move existing quotes from posts to quotes
-- Logic: A post is a quote if it has original_post_id AND content is not empty.
-- We verify if 'is_quote' column exists, if so utilize it, otherwise use inference.

DO $$
BEGIN
    INSERT INTO quotes (user_id, original_post_id, content, created_at, is_official)
    SELECT user_id, original_post_id, content, created_at, is_official
    FROM posts
    WHERE original_post_id IS NOT NULL 
      AND content IS NOT NULL 
      AND content != '';
      
    -- OPTIONAL: Delete migrated quotes from posts table to avoid duplicates in feed
    -- Uncomment the next line if you want to remove them from posts immediately
    DELETE FROM posts 
    WHERE original_post_id IS NOT NULL 
      AND content IS NOT NULL 
      AND content != '';
      
    RAISE NOTICE 'Migrated quotes to new table.';
END $$;

COMMIT;
