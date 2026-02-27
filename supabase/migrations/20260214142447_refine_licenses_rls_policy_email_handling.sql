/*
  # Refine Licenses RLS Policy - Better Email Handling

  ## Issue
  The previous fix used auth.jwt() to get the email, but the JWT email is returned
  as a JSON string with quotes, so we need to properly extract and clean it.

  ## Solution
  Use the ->> operator to extract the email as text (without quotes) and handle
  case-insensitive email comparison properly.

  ## Changes
  1. Drop the previous policy
  2. Create a new policy with proper email extraction from JWT
  3. Use case-insensitive comparison for emails
*/

-- Drop the previous policy
DROP POLICY IF EXISTS "Users can view their assigned licenses" ON licenses;

-- Create refined policy with proper JWT email extraction
CREATE POLICY "Users can view their assigned licenses"
  ON licenses
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    LOWER(invited_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
  );
