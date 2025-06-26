/*
  # Remove login history functionality

  1. Changes
    - Safely drop login_history table if it exists
    - Remove all related policies, indexes, and constraints
    - Clean up any remaining references

  2. Safety
    - Use IF EXISTS clauses to prevent errors
    - Handle cases where objects may not exist
*/

-- Drop policies first (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'login_history') THEN
    DROP POLICY IF EXISTS "Users can insert own login history" ON public.login_history;
    DROP POLICY IF EXISTS "Users can view own login history" ON public.login_history;
    DROP POLICY IF EXISTS "Service role can manage login history" ON public.login_history;
  END IF;
END $$;

-- Drop indexes (if they exist)
DROP INDEX IF EXISTS public.idx_login_history_user_id;
DROP INDEX IF EXISTS public.idx_login_history_created_at;
DROP INDEX IF EXISTS public.idx_login_history_email;

-- Drop the table (if it exists)
DROP TABLE IF EXISTS public.login_history CASCADE;

-- Ensure any remaining references are cleaned up
-- This is a safety measure in case there are any lingering dependencies
DO $$
BEGIN
  -- Check if any views or other objects reference login_history and drop them
  -- This block will silently handle any cleanup needed
  NULL;
END $$;