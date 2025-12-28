-- 1. Create table for user settings (If it failed before)
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    public_profile BOOLEAN DEFAULT true,
    show_email BOOLEAN DEFAULT false,
    show_faculty BOOLEAN DEFAULT true,
    push_notifs BOOLEAN DEFAULT true,
    email_notifs BOOLEAN DEFAULT true,
    notify_mentions BOOLEAN DEFAULT true,
    notify_likes BOOLEAN DEFAULT true,
    notify_marketing BOOLEAN DEFAULT false,
    theme TEXT DEFAULT 'system',
    high_contrast BOOLEAN DEFAULT false,
    has_seen_welcome BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Add Sharing capabilities to Posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- 2.1 Add Quote Sharing (Reference to original post)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- 3. RPC for shares count (Increment)
CREATE OR REPLACE FUNCTION increment_shares_count(post_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET shares_count = shares_count + 1
  WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC for self-deletion (If missing)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Avatars bucket (Idempotent)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
