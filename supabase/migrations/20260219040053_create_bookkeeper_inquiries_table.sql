/*
  # Create Bookkeeper Inquiries Table

  1. New Tables
    - `bookkeeper_inquiries`
      - `id` (uuid, primary key) - Unique identifier for each inquiry
      - `user_id` (uuid, foreign key) - References the user who submitted the inquiry
      - `message` (text) - The inquiry message or question from the user
      - `created_at` (timestamptz) - Timestamp when the inquiry was created

  2. Security
    - Enable RLS on `bookkeeper_inquiries` table
    - Add policy for authenticated users to insert their own inquiries
    - Add policy for users to read only their own inquiries

  3. Purpose
    - This table stores inquiries from users who want to connect with Easy Expense App's bookkeeping services
    - Users can submit multiple inquiries without limitation
    - Emails are sent to jenny@middlemanbooks.com when inquiries are created
*/

-- Create the bookkeeper_inquiries table
CREATE TABLE IF NOT EXISTS bookkeeper_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookkeeper_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own inquiries
CREATE POLICY "Users can create own bookkeeper inquiries"
  ON bookkeeper_inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own inquiries
CREATE POLICY "Users can read own bookkeeper inquiries"
  ON bookkeeper_inquiries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_bookkeeper_inquiries_user_id ON bookkeeper_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_bookkeeper_inquiries_created_at ON bookkeeper_inquiries(created_at DESC);