/*
  # Add Show Create Reports Default to Profiles

  1. Changes
    - Add `show_create_reports_default` boolean column to `profiles` table
    - Default value is `false` (hide the create reports option by default)
    - Column is nullable to handle existing records gracefully

  2. Purpose
    - Allows users to control whether they see the "Expense Report" field when uploading/editing receipts
    - Provides user-level preference control for the expense report feature
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_create_reports_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_create_reports_default boolean DEFAULT false;
  END IF;
END $$;