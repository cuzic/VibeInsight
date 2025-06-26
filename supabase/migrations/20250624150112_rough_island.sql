/*
  # Create login history table

  1. New Tables
    - `login_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `email` (text, user email at time of login)
      - `login_type` (text, 'signin' or 'signup')
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)
      - `success` (boolean, whether login was successful)
      - `error_message` (text, optional error message)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `login_history` table
    - Add policies for users to read their own login history
    - Add policy for system to insert login records

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on created_at for time-based queries
*/

-- Create login history table
CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  login_type text NOT NULL CHECK (login_type IN ('signin', 'signup')),
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own login history"
  ON login_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow system to insert login records (for service role)
CREATE POLICY "System can insert login history"
  ON login_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own login history
CREATE POLICY "Users can insert own login history"
  ON login_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_email ON login_history(email);