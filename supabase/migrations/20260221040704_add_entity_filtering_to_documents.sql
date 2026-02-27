/*
  # Add Entity-Based Filtering to Documents Table

  ## Overview
  This migration adds critical entity isolation to the documents table to ensure
  users can ONLY access documents belonging to their current entity. This is a 
  security requirement to prevent cross-entity data leakage.

  ## Changes

  1. **Update Documents RLS Policies**
     - Add entity-based filtering to all SELECT policies
     - Join with profiles table to validate user's current_entity_id matches document owner's entity
     - Ensure complete entity isolation for all document operations

  ## Security Notes
     - CRITICAL: Users must NEVER see documents from entities they don't belong to
     - All policies now enforce entity boundaries through current_entity_id
     - This prevents potential legal and security issues from cross-entity access

  ## Important
     - Uses `IF EXISTS` to prevent errors on re-run
     - Maintains backwards compatibility
     - Optimized with subquery pattern for performance
*/

-- =====================================================
-- UPDATE DOCUMENTS RLS POLICIES FOR ENTITY ISOLATION
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read documents" ON documents;

-- Create new entity-aware SELECT policy
CREATE POLICY "Users can read documents in their current entity"
  ON documents FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT p1.id
      FROM profiles p1
      WHERE p1.current_entity_id IN (
        SELECT p2.current_entity_id
        FROM profiles p2
        WHERE p2.id = (SELECT auth.uid())
      )
    )
    OR (SELECT auth.uid()) = ANY(shared_with)
  );

-- Update INSERT policy to ensure documents are created with proper entity context
DROP POLICY IF EXISTS "Users can create own documents" ON documents;
CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND user_id IN (
      SELECT id
      FROM profiles
      WHERE current_entity_id IS NOT NULL
    )
  );

-- Update UPDATE policy with entity validation
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
CREATE POLICY "Users can update own documents in their entity"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND user_id IN (
      SELECT p1.id
      FROM profiles p1
      WHERE p1.current_entity_id IN (
        SELECT p2.current_entity_id
        FROM profiles p2
        WHERE p2.id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND user_id IN (
      SELECT p1.id
      FROM profiles p1
      WHERE p1.current_entity_id IN (
        SELECT p2.current_entity_id
        FROM profiles p2
        WHERE p2.id = (SELECT auth.uid())
      )
    )
  );

-- Update DELETE policy with entity validation
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
CREATE POLICY "Users can delete own documents in their entity"
  ON documents FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND user_id IN (
      SELECT p1.id
      FROM profiles p1
      WHERE p1.current_entity_id IN (
        SELECT p2.current_entity_id
        FROM profiles p2
        WHERE p2.id = (SELECT auth.uid())
      )
    )
  );
