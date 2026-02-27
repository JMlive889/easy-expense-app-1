/*
  # Add header visibility preference to profiles

  1. Changes
    - Add `header_visible` boolean column to `profiles` table
    - Default value is `true` (header visible by default)
    
  2. Purpose
    - Store user preference for showing/hiding the top green header bar
    - Persists across sessions for personalized workspace layout
    
  3. Security
    - Users can only update their own header visibility preference
    - Existing RLS policies on profiles table apply
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'header_visible'
  ) THEN
    ALTER TABLE profiles ADD COLUMN header_visible boolean DEFAULT true;
  END IF;
END $$;
