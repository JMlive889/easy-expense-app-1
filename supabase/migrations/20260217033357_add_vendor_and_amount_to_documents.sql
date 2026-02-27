/*
  # Add Vendor and Amount Fields to Documents Table

  1. Changes
    - Add `vendor` column (text) to store vendor/merchant name
    - Add `amount` column (numeric) to store transaction amount
    - Add index on vendor for search performance

  2. Notes
    - Vendor field is optional (nullable) to support existing records
    - Amount uses numeric type for precise currency values
    - Both fields can be updated by document owners
*/

-- Add vendor column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'vendor'
  ) THEN
    ALTER TABLE documents ADD COLUMN vendor text;
  END IF;
END $$;

-- Add amount column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'amount'
  ) THEN
    ALTER TABLE documents ADD COLUMN amount numeric(10, 2);
  END IF;
END $$;

-- Create index on vendor for search performance
CREATE INDEX IF NOT EXISTS documents_vendor_idx ON documents(vendor);
