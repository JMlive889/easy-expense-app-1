/*
  # Add Show Billable/Reimbursable Setting to Profiles

  1. Changes
    - Add `show_billable_reimbursable_default` column to `profiles` table
      - Type: boolean
      - Default: false
      - Purpose: Controls whether users see billable/reimbursable fields in the UI
      - When ON: Always shows "Billable: Yes/No" and "Reimbursable: Yes/No"
      - When OFF: Completely hides these fields from the interface

  2. Notes
    - This is a user preference setting, similar to `show_create_reports_default`
    - Existing users will default to false (fields hidden)
    - Users can enable this in User Settings to show the fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_billable_reimbursable_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_billable_reimbursable_default boolean DEFAULT false;
  END IF;
END $$;
