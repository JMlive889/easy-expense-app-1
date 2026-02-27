/*
  # Add Expense Report to Documents

  1. Changes
    - Add `expense_report` text column to `documents` table
    - Column is nullable since not all receipts will be assigned to an expense report
    - Allows receipts to be grouped and categorized by expense report name/identifier

  2. Purpose
    - Enables users to organize receipts into expense reports
    - Facilitates better receipt categorization and reporting
    - Supports expense report workflows for business expense tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'expense_report'
  ) THEN
    ALTER TABLE documents ADD COLUMN expense_report text;
  END IF;
END $$;