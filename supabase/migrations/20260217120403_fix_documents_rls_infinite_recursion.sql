/*
  # Fix Infinite Recursion in Documents RLS Policies

  ## Problem
  The child image policies were querying the documents table from within documents RLS policies,
  causing infinite recursion: Policy → Query documents → Policy → Loop forever

  ## Solution
  1. Drop the recursive child image policies
  2. Rely on the fact that child images should have the same user_id as their parent
  3. The existing "Users can view own documents" policy will handle both parent and child access
  
  ## Changes
  - Drop 4 problematic policies that caused recursion
  - Child images will be accessible via their user_id (same as parent)
  - Simpler, more performant approach

  ## Important Notes
  - Child images MUST have the same user_id as their parent document
  - This will be enforced at the application level when creating child images
  - No more recursive policy checks needed
*/

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view child images of accessible documents" ON documents;
DROP POLICY IF EXISTS "Users can add child images to their documents" ON documents;
DROP POLICY IF EXISTS "Users can update child images of their documents" ON documents;
DROP POLICY IF EXISTS "Users can delete child images of their documents" ON documents;

-- The existing policies already handle access control correctly:
-- "Users can view own documents" - handles both parent and child documents via user_id
-- "Users can create own documents" - allows creating both parent and child
-- "Users can update own documents" - allows updating both parent and child
-- "Users can delete own documents" - allows deleting both parent and child

-- No additional policies needed! Child images inherit access through user_id matching.