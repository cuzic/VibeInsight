/*
  # Create text entries table

  1. New Tables
    - `text_entries`
      - `id` (uuid, primary key)
      - `content` (text, the Japanese text content)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `text_entries` table
    - Add policy for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS text_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE text_entries ENABLE ROW LEVEL SECURITY;

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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_text_entries_updated_at
  BEFORE UPDATE ON text_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();