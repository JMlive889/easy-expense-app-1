/*
  # Add User Default Settings to Profiles

  1. Changes
    - Add `billable_default` boolean column to profiles table
      - Default value: false
      - Used as default setting for new receipts created by this user
    
    - Add `reimbursable_default` boolean column to profiles table
      - Default value: false
      - Used as default setting for new receipts created by this user
    
    - Add `show_enter_multiple_default` boolean column to profiles table
      - Default value: false
      - Placeholder for future "Enter Multiple Items" feature
  
  2. Security
    - No RLS changes needed (profiles table already has proper RLS)
    - All columns are user-specific preferences
  
  3. Data Migration
    - All existing users will have these fields set to false (off) by default
*/

-- Add billable_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'billable_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billable_default boolean DEFAULT false;
  END IF;
END $$;

-- Add reimbursable_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'reimbursable_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN reimbursable_default boolean DEFAULT false;
  END IF;
END $$;

-- Add show_enter_multiple_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_enter_multiple_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_enter_multiple_default boolean DEFAULT false;
  END IF;
END $$;