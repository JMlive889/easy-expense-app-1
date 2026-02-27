/*
  # Add billable and reimbursable flags to documents

  ## Summary
  Adds two boolean flags to the documents table to track whether a receipt/document
  is billable to a client or reimbursable by an employer/entity.

  ## Changes
  ### Modified Tables
  - `documents`
    - `billable` (boolean, default false) — marks the document as billable to a client
    - `reimbursable` (boolean, default false) — marks the document as reimbursable

  ## Notes
  - Both columns default to false so existing records are unaffected
  - No RLS changes required as existing document policies cover these new columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'billable'
  ) THEN
    ALTER TABLE documents ADD COLUMN billable boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'reimbursable'
  ) THEN
    ALTER TABLE documents ADD COLUMN reimbursable boolean NOT NULL DEFAULT false;
  END IF;
END $$;
