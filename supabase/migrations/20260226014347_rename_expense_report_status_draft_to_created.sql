/*
  # Rename Expense Report Status: 'draft' → 'created'

  ## Summary
  This migration updates the expense_reports table to use 'created' as the
  default status instead of 'draft'. It also migrates all existing rows and
  adds a CHECK constraint to enforce only valid status values.

  ## Changes

  ### expense_reports table
  - Default value of `status` column changed from 'draft' to 'created'
  - All rows with status = 'draft' updated to status = 'created'
  - CHECK constraint added: status must be 'created' or 'batched'

  ## Valid Statuses
  - `created` - Report is open; receipts can be added. Not all receipts are batched yet.
  - `batched`  - All receipts in this report have been batched. Report is locked.

  ## Notes
  - The status transitions are fully automatic based on receipt statuses.
  - When all receipts in a report are batched → report becomes 'batched'.
  - If any receipt is un-batched → report automatically reverts to 'created'.
*/

UPDATE expense_reports
SET status = 'created'
WHERE status = 'draft';

ALTER TABLE expense_reports
  ALTER COLUMN status SET DEFAULT 'created';

ALTER TABLE expense_reports
  DROP CONSTRAINT IF EXISTS expense_reports_status_check;

ALTER TABLE expense_reports
  ADD CONSTRAINT expense_reports_status_check
  CHECK (status IN ('created', 'batched'));
