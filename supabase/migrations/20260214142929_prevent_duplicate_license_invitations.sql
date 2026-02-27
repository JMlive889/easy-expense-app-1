/*
  # Prevent Duplicate License Invitations

  1. Changes
    - Add unique partial index on licenses table to prevent duplicate invitations
    - Index ensures only one non-archived license per email address
    - Archived licenses are excluded from the uniqueness constraint
    
  2. Security
    - Prevents race conditions where multiple invitations are sent simultaneously
    - Enforces data integrity at the database level
    - Works alongside application-level validation for robust duplicate prevention
    
  3. Technical Details
    - Partial index only applies to non-archived licenses (status != 'archived')
    - Case-insensitive email matching using LOWER() function
    - This allows the same email to be invited again if previous license is archived
*/

-- Create a unique partial index to prevent duplicate non-archived licenses per email
-- The index uses LOWER(invited_email) for case-insensitive uniqueness
-- Only applies when status is not 'archived', allowing re-invitations after archiving
CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_unique_active_email 
  ON licenses (LOWER(invited_email)) 
  WHERE status != 'archived';