-- Add 'has_seen_welcome' to user_settings to track first-time experience
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN DEFAULT FALSE;

-- Add 'shares_count' to posts to track engagement
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Function to increment shares count atomically
CREATE OR REPLACE FUNCTION increment_shares_count(post_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET shares_count = shares_count + 1
  WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Index for mentions searches if we were doing heavy regex in SQL, 
-- but we are doing parsing in JS, so standard text search is fine for now.
