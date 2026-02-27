/*
  # Add view preference to profiles

  1. Changes
    - Add `view_preference` column to `profiles` table
      - Type: text
      - Constraint: Only 'grid' or 'list' values allowed
      - Default: 'grid'
      - Nullable: true (to support existing users)

  2. Purpose
    - Allow users to persist their preferred view mode (grid or list) across Documents and Receipts pages
    - Improves user experience by maintaining consistent view preferences
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'view_preference'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN view_preference text 
    DEFAULT 'grid'
    CHECK (view_preference IN ('grid', 'list'));
  END IF;
END $$;