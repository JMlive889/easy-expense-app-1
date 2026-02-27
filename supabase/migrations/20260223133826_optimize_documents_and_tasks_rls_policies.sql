/*
  # Optimize Documents and Tasks RLS Policies

  1. Performance Improvement
    - Wraps all auth.uid() calls with SELECT to prevent re-evaluation per row
    - Significantly improves query performance at scale
    
  2. Security
    - Maintains exact same RBAC logic
    - Owner/Accountant can view all entity documents
    - Users can view their own documents and assigned tasks
*/

-- =====================================================
-- OPTIMIZE DOCUMENTS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view accessible documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their entity" ON documents;
DROP POLICY IF EXISTS "Users can update accessible documents" ON documents;
DROP POLICY IF EXISTS "Users can delete accessible documents" ON documents;

CREATE POLICY "Users can view accessible documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = (SELECT auth.uid())
        AND current_user_profile.current_entity_id IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM entity_memberships em
            WHERE em.user_id = (SELECT auth.uid())
              AND em.entity_id = current_user_profile.current_entity_id
              AND em.is_active = true
              AND em.role IN ('owner', 'accountant')
              AND user_id IN (
                SELECT p.id FROM profiles p
                WHERE p.current_entity_id = current_user_profile.current_entity_id
              )
          )
          OR
          (user_id = (SELECT auth.uid()))
          OR
          EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.document_id = documents.id
              AND (SELECT auth.uid()) = ANY(t.assigned_users)
          )
        )
    )
  );

CREATE POLICY "Users can insert documents in their entity"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
        AND current_entity_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update accessible documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = (SELECT auth.uid())
        AND current_user_profile.current_entity_id IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM entity_memberships em
            WHERE em.user_id = (SELECT auth.uid())
              AND em.entity_id = current_user_profile.current_entity_id
              AND em.is_active = true
              AND em.role IN ('owner', 'accountant')
              AND user_id IN (
                SELECT p.id FROM profiles p
                WHERE p.current_entity_id = current_user_profile.current_entity_id
              )
          )
          OR
          user_id = (SELECT auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = (SELECT auth.uid())
        AND current_user_profile.current_entity_id IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM entity_memberships em
            WHERE em.user_id = (SELECT auth.uid())
              AND em.entity_id = current_user_profile.current_entity_id
              AND em.is_active = true
              AND em.role IN ('owner', 'accountant')
              AND user_id IN (
                SELECT p.id FROM profiles p
                WHERE p.current_entity_id = current_user_profile.current_entity_id
              )
          )
          OR
          user_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "Users can delete accessible documents"
  ON documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = (SELECT auth.uid())
        AND current_user_profile.current_entity_id IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM entity_memberships em
            WHERE em.user_id = (SELECT auth.uid())
              AND em.entity_id = current_user_profile.current_entity_id
              AND em.is_active = true
              AND em.role IN ('owner', 'accountant')
              AND user_id IN (
                SELECT p.id FROM profiles p
                WHERE p.current_entity_id = current_user_profile.current_entity_id
              )
          )
          OR
          user_id = (SELECT auth.uid())
        )
    )
  );

-- =====================================================
-- OPTIMIZE TASKS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view accessible tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their entity" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update accessible tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete accessible tasks" ON tasks;

CREATE POLICY "Users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = (SELECT auth.uid())
        AND current_user_profile.current_entity_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM entity_memberships em
          WHERE em.user_id = (SELECT auth.uid())
            AND em.entity_id = current_user_profile.current_entity_id
            AND em.is_active = true
            AND em.role IN ('owner', 'accountant')
            AND entity_id = current_user_profile.current_entity_id
        )
    )
    OR
    created_by = (SELECT auth.uid())
    OR
    (SELECT auth.uid()) = ANY(assigned_users)
  );

CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
        AND current_entity_id = tasks.entity_id
    )
  );

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = (SELECT auth.uid())
        AND current_user_profile.current_entity_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM entity_memberships em
          WHERE em.user_id = (SELECT auth.uid())
            AND em.entity_id = current_user_profile.current_entity_id
            AND em.is_active = true
            AND em.role IN ('owner', 'accountant')
            AND entity_id = current_user_profile.current_entity_id
        )
    )
    OR
    created_by = (SELECT auth.uid())
    OR
    (SELECT auth.uid()) = ANY(assigned_users)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = (SELECT auth.uid())
        AND current_user_profile.current_entity_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM entity_memberships em
          WHERE em.user_id = (SELECT auth.uid())
            AND em.entity_id = current_user_profile.current_entity_id
            AND em.is_active = true
            AND em.role IN ('owner', 'accountant')
            AND entity_id = current_user_profile.current_entity_id
        )
    )
    OR
    created_by = (SELECT auth.uid())
    OR
    (SELECT auth.uid()) = ANY(assigned_users)
  );

CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = (SELECT auth.uid())
        AND current_user_profile.current_entity_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM entity_memberships em
          WHERE em.user_id = (SELECT auth.uid())
            AND em.entity_id = current_user_profile.current_entity_id
            AND em.is_active = true
            AND em.role IN ('owner', 'accountant')
            AND entity_id = current_user_profile.current_entity_id
        )
    )
    OR
    created_by = (SELECT auth.uid())
  );
