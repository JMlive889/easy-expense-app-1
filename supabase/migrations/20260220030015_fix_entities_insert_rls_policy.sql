/*
  # Fix Entities INSERT RLS Policy

  1. Changes
    - Drop the overly restrictive "System can insert entities" policy
    - Create a proper policy that allows users to create entities where they are the owner
    
  2. Security
    - Ensures authenticated users can only create entities for themselves
    - Validates that owner_id matches the authenticated user's ID
    - Prevents users from creating entities with other users as owners
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "System can insert entities" ON entities;

-- Create a proper policy that ensures users can only create entities for themselves
CREATE POLICY "Users can create entities for themselves"
ON entities
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());
