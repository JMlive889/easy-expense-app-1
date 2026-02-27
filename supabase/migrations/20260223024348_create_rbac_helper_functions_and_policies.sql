/*
  # Create RBAC Helper Functions and Update RLS Policies
  
  1. Helper Functions
    - `get_user_entity_role(user_uuid, entity_uuid)` - Returns user's role in an entity
    - `can_view_all_entity_documents(user_uuid, entity_uuid)` - Checks if user can view all documents
  
  2. Updated RLS Policies
    - Documents table: Filter based on entity role (owner/accountant see all, users see only their own or assigned)
    - Tasks table: Filter based on entity role and assigned_users array
  
  3. Performance
    - Add indexes on entity_memberships for faster role lookups
    - Add indexes on tasks for assigned_users queries
  
  4. Security
    - All queries check entity membership and role
    - Users (guests) only see data they created or were explicitly assigned to
    - Owners and Accountants see all entity data
*/

-- Helper function to get user's role in an entity
CREATE OR REPLACE FUNCTION get_user_entity_role(user_uuid uuid, entity_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM entity_memberships
  WHERE user_id = user_uuid 
    AND entity_id = entity_uuid 
    AND is_active = true
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'guest');
END;
$$;

-- Helper function to check if user can view all documents in an entity
CREATE OR REPLACE FUNCTION can_view_all_entity_documents(user_uuid uuid, entity_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  user_role := get_user_entity_role(user_uuid, entity_uuid);
  RETURN user_role IN ('owner', 'accountant');
END;
$$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_entity_memberships_user_entity_active 
  ON entity_memberships(user_id, entity_id, is_active);

CREATE INDEX IF NOT EXISTS idx_entity_memberships_entity_role 
  ON entity_memberships(entity_id, role) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tasks_document_id 
  ON tasks(document_id) WHERE document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_users 
  ON tasks USING GIN(assigned_users);

CREATE INDEX IF NOT EXISTS idx_profiles_current_entity 
  ON profiles(current_entity_id) WHERE current_entity_id IS NOT NULL;

-- Drop existing documents RLS policies
DROP POLICY IF EXISTS "Users can read documents in their current entity" ON documents;
DROP POLICY IF EXISTS "Users can create own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents in their entity" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents in their entity" ON documents;

-- Create new RBAC-aware documents policies
CREATE POLICY "Users can view accessible documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    -- Get current user's entity
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = auth.uid()
        AND current_user_profile.current_entity_id IS NOT NULL
        AND (
          -- Owner/Accountant: see all documents from users in the same entity
          EXISTS (
            SELECT 1 FROM entity_memberships em
            WHERE em.user_id = auth.uid()
              AND em.entity_id = current_user_profile.current_entity_id
              AND em.is_active = true
              AND em.role IN ('owner', 'accountant')
              AND user_id IN (
                SELECT p.id FROM profiles p
                WHERE p.current_entity_id = current_user_profile.current_entity_id
              )
          )
          OR
          -- Guest: see own documents
          (user_id = auth.uid())
          OR
          -- Guest: see documents they're assigned to via tasks
          EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.document_id = documents.id
              AND auth.uid() = ANY(t.assigned_users)
          )
        )
    )
  );

CREATE POLICY "Users can insert documents in their entity"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND current_entity_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update accessible documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = auth.uid()
        AND current_user_profile.current_entity_id IS NOT NULL
        AND (
          -- Owner/Accountant: update all entity documents
          EXISTS (
            SELECT 1 FROM entity_memberships em
            WHERE em.user_id = auth.uid()
              AND em.entity_id = current_user_profile.current_entity_id
              AND em.is_active = true
              AND em.role IN ('owner', 'accountant')
              AND user_id IN (
                SELECT p.id FROM profiles p
                WHERE p.current_entity_id = current_user_profile.current_entity_id
              )
          )
          OR
          -- Users: update own documents
          user_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = auth.uid()
        AND current_user_profile.current_entity_id IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM entity_memberships em
            WHERE em.user_id = auth.uid()
              AND em.entity_id = current_user_profile.current_entity_id
              AND em.is_active = true
              AND em.role IN ('owner', 'accountant')
              AND user_id IN (
                SELECT p.id FROM profiles p
                WHERE p.current_entity_id = current_user_profile.current_entity_id
              )
          )
          OR
          user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can delete accessible documents"
  ON documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = auth.uid()
        AND current_user_profile.current_entity_id IS NOT NULL
        AND (
          -- Owner/Accountant: delete all entity documents
          EXISTS (
            SELECT 1 FROM entity_memberships em
            WHERE em.user_id = auth.uid()
              AND em.entity_id = current_user_profile.current_entity_id
              AND em.is_active = true
              AND em.role IN ('owner', 'accountant')
              AND user_id IN (
                SELECT p.id FROM profiles p
                WHERE p.current_entity_id = current_user_profile.current_entity_id
              )
          )
          OR
          -- Users: delete own documents
          user_id = auth.uid()
        )
    )
  );

-- Drop existing tasks RLS policies
DROP POLICY IF EXISTS "Users can view tasks in their entity" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

-- Create new RBAC-aware tasks policies
CREATE POLICY "Users can view accessible tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    -- Owner/Accountant: see all tasks in their entity
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = auth.uid()
        AND current_user_profile.current_entity_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM entity_memberships em
          WHERE em.user_id = auth.uid()
            AND em.entity_id = current_user_profile.current_entity_id
            AND em.is_active = true
            AND em.role IN ('owner', 'accountant')
            AND entity_id = current_user_profile.current_entity_id
        )
    )
    OR
    -- Guest: see own tasks
    created_by = auth.uid()
    OR
    -- Guest: see tasks they're assigned to
    auth.uid() = ANY(assigned_users)
  );

CREATE POLICY "Users can insert tasks in their entity"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND current_entity_id = tasks.entity_id
    )
  );

CREATE POLICY "Users can update accessible tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    -- Owner/Accountant: update all entity tasks
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = auth.uid()
        AND current_user_profile.current_entity_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM entity_memberships em
          WHERE em.user_id = auth.uid()
            AND em.entity_id = current_user_profile.current_entity_id
            AND em.is_active = true
            AND em.role IN ('owner', 'accountant')
            AND entity_id = current_user_profile.current_entity_id
        )
    )
    OR
    -- Users: update own tasks or tasks they're assigned to
    created_by = auth.uid()
    OR
    auth.uid() = ANY(assigned_users)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = auth.uid()
        AND current_user_profile.current_entity_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM entity_memberships em
          WHERE em.user_id = auth.uid()
            AND em.entity_id = current_user_profile.current_entity_id
            AND em.is_active = true
            AND em.role IN ('owner', 'accountant')
            AND entity_id = current_user_profile.current_entity_id
        )
    )
    OR
    created_by = auth.uid()
    OR
    auth.uid() = ANY(assigned_users)
  );

CREATE POLICY "Users can delete accessible tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    -- Owner/Accountant: delete all entity tasks
    EXISTS (
      SELECT 1 FROM profiles current_user_profile
      WHERE current_user_profile.id = auth.uid()
        AND current_user_profile.current_entity_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM entity_memberships em
          WHERE em.user_id = auth.uid()
            AND em.entity_id = current_user_profile.current_entity_id
            AND em.is_active = true
            AND em.role IN ('owner', 'accountant')
            AND entity_id = current_user_profile.current_entity_id
        )
    )
    OR
    -- Users: delete own tasks
    created_by = auth.uid()
  );