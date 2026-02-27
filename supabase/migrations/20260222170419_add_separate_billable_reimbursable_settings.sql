/*
  # Add Separate Billable and Reimbursable Settings

  1. Changes
    - Add `show_billable_default` (boolean, default false) to profiles table
    - Add `show_reimbursable_default` (boolean, default false) to profiles table
    - Migrate existing data: if `show_billable_reimbursable_default` was true, set both new columns to true
    - Remove old `show_billable_reimbursable_default` column

  2. Behavior
    - `show_billable_default`: when true, shows Billable flag on receipts and defaults new receipts to billable=true
    - `show_reimbursable_default`: when true, shows Reimbursable flag on receipts and defaults new receipts to reimbursable=true
    - Each toggle is fully independent

  3. Notes
    - Existing users with `show_billable_reimbursable_default = true` will have both new columns set to true
    - Existing users with `show_billable_reimbursable_default = false` will have both new columns set to false (the default)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_billable_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_billable_default boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_reimbursable_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_reimbursable_default boolean NOT NULL DEFAULT false;
  END IF;
END $$;

UPDATE profiles
SET
  show_billable_default = COALESCE(show_billable_reimbursable_default, false),
  show_reimbursable_default = COALESCE(show_billable_reimbursable_default, false)
WHERE show_billable_reimbursable_default IS TRUE;
