/*
  # Add theme preference to profiles

  1. Changes
    - Add `theme_preference` column to profiles table
      - Type: TEXT
      - Default: 'dark'
      - Values: 'dark' or 'light'
  
  2. Purpose
    - Store user's preferred theme (light or dark mode)
    - Enable persistent theme settings across sessions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light'));
  END IF;
END $$;