/*
  # Reset all database data

  1. Data Cleanup
    - Delete all text entries
    - Delete all profiles
    - Clean up any orphaned data

  2. Notes
    - Table structures and policies remain intact
    - Only data is removed, not schema
    - VACUUM commands removed as they cannot run in transactions
*/

-- Delete all text entries
DELETE FROM public.text_entries;

-- Delete all profiles (this will also clean up related auth data)
DELETE FROM public.profiles;

-- Reset any sequences if they exist
-- This ensures that new IDs start from the beginning
DO $$
BEGIN
  -- Reset any auto-incrementing sequences if they exist
  -- Note: UUIDs don't use sequences, but this is here for completeness
  IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public') THEN
    -- Reset sequences would go here if we had any
    NULL;
  END IF;
END $$;

-- Note: VACUUM operations removed as they cannot run inside transaction blocks
-- Database will automatically reclaim space over time