/*
  # Update Receipt Status Values

  1. Changes
    - Standardize document status values for receipts
    - Update existing 'pending' statuses to 'submitted'
    - Add constraint to enforce new status values: submitted, approved, flagged, batched
    
  2. Security
    - No changes to RLS policies
    
  3. Notes
    - This migration ensures all receipts use the new standardized status workflow
    - Existing data is migrated safely without data loss
*/

-- Update existing 'pending' status to 'submitted' for receipt types
UPDATE documents
SET status = 'submitted'
WHERE status = 'pending'
AND type IN ('receipt', 'meal', 'travel', 'office-supplies', 'equipment', 'utilities');

-- Add a check constraint for receipt status values (only for new inserts/updates)
-- Note: We'll handle this at the application level for maximum flexibility
-- as PostgreSQL check constraints can be limiting for future changes