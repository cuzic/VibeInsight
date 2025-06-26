/*
  # Create text_entries table with RLS policies

  1. New Tables
    - `text_entries`
      - `id` (uuid, primary key)
      - `content` (text, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `text_entries` table
    - Add policies for authenticated users to perform CRUD operations

  3. Functions
    - Create trigger function to auto-update `updated_at` column
*/

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the text_entries table
CREATE TABLE IF NOT EXISTS text_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE text_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can read all text entries" ON text_entries;
DROP POLICY IF EXISTS "Users can insert text entries" ON text_entries;
DROP POLICY IF EXISTS "Users can update text entries" ON text_entries;
DROP POLICY IF EXISTS "Users can delete text entries" ON text_entries;

-- Create policies for authenticated users
CREATE POLICY "Users can read all text entries"
  ON text_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert text entries"
  ON text_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update text entries"
  ON text_entries
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete text entries"
  ON text_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_text_entries_updated_at ON text_entries;

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_text_entries_updated_at
  BEFORE UPDATE ON text_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();