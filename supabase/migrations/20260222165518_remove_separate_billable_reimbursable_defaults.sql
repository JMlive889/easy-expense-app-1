/*
  # Simplify Billable/Reimbursable Settings

  1. Changes
    - Remove `billable_default` column from profiles table
    - Remove `reimbursable_default` column from profiles table
    - Keep only `show_billable_reimbursable_default` which controls both visibility and default values
  
  2. Data Migration
    - No data migration needed as we're removing unused columns
    - `show_billable_reimbursable_default` already exists and controls the feature
  
  3. Notes
    - Simplifies user experience from 3 toggles to 1
    - When `show_billable_reimbursable_default` is true: show section and default to billable/reimbursable
    - When `show_billable_reimbursable_default` is false: hide section and default to not billable/not reimbursable
*/

-- Remove the separate default columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'billable_default'
  ) THEN
    ALTER TABLE profiles DROP COLUMN billable_default;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'reimbursable_default'
  ) THEN
    ALTER TABLE profiles DROP COLUMN reimbursable_default;
  END IF;
END $$;