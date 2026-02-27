/*
  # Add Default Settings to Entities Table

  ## Summary
  Moves the 5 default receipt/UI settings from per-user profiles to the entities table,
  making them entity-wide settings that apply to all members of an entity.

  ## Changes

  ### Modified Tables
  - `entities`
    - `show_billable_default` (boolean, default false) - Whether to show the Billable flag on receipts and default new receipts to billable
    - `show_reimbursable_default` (boolean, default false) - Whether to show the Reimbursable flag and default new receipts to reimbursable
    - `show_enter_multiple_default` (boolean, default false) - Whether to enable bulk entry mode for multiple receipts
    - `show_create_reports_default` (boolean, default false) - Whether to show the Create Reports option
    - `upload_multiple_images_default` (boolean, default false) - Whether to enable uploading multiple images at once

  ## Notes
  - All columns default to false (opt-in behavior unchanged)
  - The old columns on profiles remain intact to avoid data loss; they are simply no longer used by the UI
  - No data migration is needed since defaults are false and this is opt-in behavior
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entities' AND column_name = 'show_billable_default'
  ) THEN
    ALTER TABLE entities ADD COLUMN show_billable_default boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entities' AND column_name = 'show_reimbursable_default'
  ) THEN
    ALTER TABLE entities ADD COLUMN show_reimbursable_default boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entities' AND column_name = 'show_enter_multiple_default'
  ) THEN
    ALTER TABLE entities ADD COLUMN show_enter_multiple_default boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entities' AND column_name = 'show_create_reports_default'
  ) THEN
    ALTER TABLE entities ADD COLUMN show_create_reports_default boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entities' AND column_name = 'upload_multiple_images_default'
  ) THEN
    ALTER TABLE entities ADD COLUMN upload_multiple_images_default boolean NOT NULL DEFAULT false;
  END IF;
END $$;
