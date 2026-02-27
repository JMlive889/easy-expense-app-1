/*
  # Add phone number field to profiles table

  1. Changes
    - Add `phone_number` (text) column to `profiles` table
    - Field is optional (nullable) for user's phone number
  
  2. Notes
    - Uses IF NOT EXISTS pattern to prevent errors if column already exists
    - No default value since phone numbers are optional user data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;