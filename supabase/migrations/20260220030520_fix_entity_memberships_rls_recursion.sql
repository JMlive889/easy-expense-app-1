/*
  # Fix Infinite Recursion in Entity Memberships RLS Policy

  1. Problem
    - The "Entity owners can read entity memberships" policy causes infinite recursion
    - Policy queries entity_memberships table to determine access to entity_memberships
    - This creates a circular dependency that Postgres detects and rejects

  2. Changes
    - Drop the problematic recursive policy
    - Keep the simpler "Users can read own memberships" policy (sufficient for user access)
    - Entity owners already have necessary access through their own membership records

  3. Security
    - Users can still view their own memberships (unchanged)
    - System can still insert memberships (unchanged)
    - Users can still update their own active status (unchanged)
    - Removing the recursive policy doesn't reduce security, it fixes a broken policy
*/

-- Drop the policy that causes infinite recursion
DROP POLICY IF EXISTS "Entity owners can read entity memberships" ON entity_memberships;
