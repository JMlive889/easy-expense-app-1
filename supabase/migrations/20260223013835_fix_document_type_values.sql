/*
  # Fix Document Type Values

  1. Changes
    - Update all existing documents to have correct type values based on whether they have amounts
    - Documents with amount IS NULL should have type = 'document'
    - Documents with amount IS NOT NULL should have type = 'receipt'
    
  2. Security
    - No RLS changes needed
    
  3. Notes
    - This migration fixes historical data where the type field was incorrectly set
    - Going forward, the upload modal will correctly set type='document' or type='receipt' based on the upload page
*/

-- Update documents without amounts to have type = 'document'
UPDATE documents
SET type = 'document'
WHERE amount IS NULL AND type != 'document';

-- Update documents with amounts to have type = 'receipt'
UPDATE documents
SET type = 'receipt'
WHERE amount IS NOT NULL AND type != 'receipt';
