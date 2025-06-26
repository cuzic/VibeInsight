/*
  # Fix authentication and login history issues

  1. Database Functions
    - Create or replace function to handle new user creation
    - Create or replace function to update updated_at timestamps

  2. Triggers
    - Create trigger to automatically create profiles when users sign up
    - Ensure updated_at triggers exist for profiles and text_entries

  3. Security Policies
    - Fix RLS policies for login_history table to allow proper insertions
    - Ensure profiles policies work correctly

  4. Data Integrity
    - Create missing profiles for existing users
*/

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create missing profiles for existing users
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  au.id, 
  au.email, 
  au.created_at, 
  now()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Drop existing policies for login_history and recreate them
DROP POLICY IF EXISTS "System can insert login history" ON public.login_history;
DROP POLICY IF EXISTS "Users can insert own login history" ON public.login_history;
DROP POLICY IF EXISTS "Users can view own login history" ON public.login_history;

-- Create proper RLS policies for login_history
CREATE POLICY "Users can insert own login history"
  ON public.login_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own login history"
  ON public.login_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage login history"
  ON public.login_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_entries ENABLE ROW LEVEL SECURITY;

-- Ensure updated_at triggers exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_text_entries_updated_at ON public.text_entries;
CREATE TRIGGER update_text_entries_updated_at
  BEFORE UPDATE ON public.text_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();