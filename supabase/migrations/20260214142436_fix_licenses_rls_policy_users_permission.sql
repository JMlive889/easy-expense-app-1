/*
  # Fix Licenses RLS Policy - Remove Direct auth.users Query

  ## Problem
  The RLS policy "Users can view their assigned licenses" was attempting to query
  the auth.users table directly, which authenticated users don't have permission to do.
  This caused a 403 error: "permission denied for table users"

  ## Solution
  Replace the problematic policy with one that uses auth.jwt() to get the user's email
  from the JWT token instead of querying auth.users directly.

  ## Changes
  1. Drop the problematic "Users can view their assigned licenses" policy
  2. Create a new policy that uses auth.jwt() to access the user's email
  3. This approach doesn't require querying auth.users and works within RLS constraints

  ## Security
  - Maintains the same security level as before
  - Users can only see licenses assigned to their email or user_id
  - Uses JWT claims which are already verified by Supabase Auth
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their assigned licenses" ON licenses;

-- Create corrected policy that uses JWT claims instead of querying auth.users
CREATE POLICY "Users can view their assigned licenses"
  ON licenses
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    invited_email = LOWER(COALESCE((auth.jwt() -> 'email')::text, ''))
  );
