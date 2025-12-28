-- 1. Create the delete_user_account RPC function
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void AS $$
BEGIN
  -- Delete all associated data
  DELETE FROM likes WHERE user_id = auth.uid();
  DELETE FROM comments WHERE user_id = auth.uid();
  DELETE FROM posts WHERE user_id = auth.uid();
  DELETE FROM notifications WHERE user_id = auth.uid();
  
  -- Delete the profile (this will trigger auth.users deletion if handled by a trigger, 
  -- or we might need to delete from auth.users if permissions allow, 
  -- but usually deleting the profile is enough for our app logic)
  DELETE FROM profiles WHERE id = auth.uid();
  
  -- Finally, delete the auth user
  -- Note: Supabase doesn't allow deleting from auth.users directly via RPC unless it's a security definer function.
  -- To really delete the auth user, we need a service role or a specific setup.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add privacy_settings column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "publicProfile": true,
  "showEmail": false,
  "showFaculty": true
}'::JSONB;

-- 3. Update RLS policies (if they exist) to respect privacy settings
-- For example, only show profiles in search if publicProfile is true
-- DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
-- CREATE POLICY "Profiles are viewable by everyone" ON profiles
--   FOR SELECT USING (
--     (privacy_settings->>'publicProfile')::boolean = true 
--     OR auth.uid() = id
--   );
