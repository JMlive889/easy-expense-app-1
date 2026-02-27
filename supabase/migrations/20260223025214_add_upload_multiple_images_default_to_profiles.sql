/*
  # Add Upload Multiple Images Default Setting

  1. Changes
    - Add `upload_multiple_images_default` column to `profiles` table
      - Type: boolean
      - Default: false
      - Description: Controls whether the user wants to upload multiple images at once by default
  
  2. Notes
    - This is a user preference setting that will be used in the future to control image upload behavior
    - The column is nullable initially to handle existing users gracefully
    - Default value is false for new users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'upload_multiple_images_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN upload_multiple_images_default boolean DEFAULT false;
  END IF;
END $$;