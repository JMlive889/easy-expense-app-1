/*
  # Fix Performance and Security Issues

  This migration addresses critical security and performance issues identified in the database:

  ## 1. Add Missing Foreign Key Indexes
    - Add index on `categories.created_by` foreign key
    - Add index on `tasks.created_by` foreign key
    These indexes improve JOIN performance and foreign key constraint checks.

  ## 2. Optimize RLS Policies with SELECT Subqueries
    All RLS policies are updated to use `(select auth.uid())` instead of `auth.uid()` 
    to prevent re-evaluation for each row, significantly improving query performance at scale.
    
    Tables affected:
    - licenses (5 policies)
    - entities (3 policies)
    - tasks (8 policies)
    - documents (5 policies)
    - categories (4 policies)
    - chats (4 policies)
    - messages (4 policies)
    - task_notifications (3 policies)

  ## 3. Fix Multiple Permissive Policies
    Convert overlapping permissive policies to a single consolidated policy or use 
    RESTRICTIVE policies where appropriate to avoid policy conflicts.

  ## 4. Fix Function Search Path Mutability
    Set explicit search_path on all functions to prevent security issues.

  ## 5. Fix Always-True RLS Policy
    Update `task_notifications` system insert policy to have proper restrictions.

  ## Important Notes
    - Uses `IF EXISTS` checks to prevent errors on re-run
    - Maintains data integrity and access patterns
    - All changes are backwards compatible
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_categories_created_by 
  ON categories(created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by 
  ON tasks(created_by);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - LICENSES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Owners can view their licenses" ON licenses;
CREATE POLICY "Owners can view their licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can create licenses" ON licenses;
CREATE POLICY "Owners can create licenses"
  ON licenses FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can update their licenses" ON licenses;
CREATE POLICY "Owners can update their licenses"
  ON licenses FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  )
  WITH CHECK (
    owner_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can delete their licenses" ON licenses;
CREATE POLICY "Owners can delete their licenses"
  ON licenses FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their assigned licenses" ON licenses;
CREATE POLICY "Users can view their assigned licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - ENTITIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own entity" ON entities;
CREATE POLICY "Users can view their own entity"
  ON entities FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own entity name" ON entities;
CREATE POLICY "Users can update their own entity name"
  ON entities FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  )
  WITH CHECK (
    id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "System can insert entities" ON entities;
CREATE POLICY "System can insert entities"
  ON entities FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - TASKS TABLE
-- =====================================================

-- Consolidate overlapping SELECT policies
DROP POLICY IF EXISTS "Entity members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks in their entity or assigned to them" ON tasks;
CREATE POLICY "Users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
    OR (select auth.uid()) = ANY(assigned_users)
  );

-- Consolidate overlapping INSERT policies
DROP POLICY IF EXISTS "Entity members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their entity" ON tasks;
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  );

-- Consolidate overlapping UPDATE policies
DROP POLICY IF EXISTS "Entity members can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON tasks;
CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
    OR created_by = (select auth.uid())
    OR (select auth.uid()) = ANY(assigned_users)
  )
  WITH CHECK (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
    OR created_by = (select auth.uid())
    OR (select auth.uid()) = ANY(assigned_users)
  );

-- Consolidate overlapping DELETE policies
DROP POLICY IF EXISTS "Entity members can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks they created" ON tasks;
CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'owner'
    )
  );

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - DOCUMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can read shared documents" ON documents;
CREATE POLICY "Users can read documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (select auth.uid()) = ANY(shared_with)
  );

DROP POLICY IF EXISTS "Users can create own documents" ON documents;
CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own documents" ON documents;
CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - CATEGORIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view categories for their entity" ON categories;
CREATE POLICY "Users can view categories for their entity"
  ON categories FOR SELECT
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can create categories" ON categories;
CREATE POLICY "Owners can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can update categories" ON categories;
CREATE POLICY "Owners can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'owner'
    )
  )
  WITH CHECK (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can delete categories" ON categories;
CREATE POLICY "Owners can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'owner'
    )
  );

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - CHATS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own chats" ON chats;
CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own chats" ON chats;
CREATE POLICY "Users can create own chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own chats" ON chats;
CREATE POLICY "Users can update own chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own chats" ON chats;
CREATE POLICY "Users can delete own chats"
  ON chats FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 8. OPTIMIZE RLS POLICIES - MESSAGES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages in own chats" ON messages;
CREATE POLICY "Users can view messages in own chats"
  ON messages FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT id 
      FROM chats 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create messages in own chats" ON messages;
CREATE POLICY "Users can create messages in own chats"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (
      SELECT id 
      FROM chats 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update messages in own chats" ON messages;
CREATE POLICY "Users can update messages in own chats"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    chat_id IN (
      SELECT id 
      FROM chats 
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    chat_id IN (
      SELECT id 
      FROM chats 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete messages in own chats" ON messages;
CREATE POLICY "Users can delete messages in own chats"
  ON messages FOR DELETE
  TO authenticated
  USING (
    chat_id IN (
      SELECT id 
      FROM chats 
      WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 9. OPTIMIZE RLS POLICIES - TASK_NOTIFICATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON task_notifications;
CREATE POLICY "Users can view their own notifications"
  ON task_notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON task_notifications;
CREATE POLICY "Users can update their own notifications"
  ON task_notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own notifications" ON task_notifications;
CREATE POLICY "Users can delete their own notifications"
  ON task_notifications FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix the always-true policy
DROP POLICY IF EXISTS "System can create notifications" ON task_notifications;
CREATE POLICY "System can create notifications"
  ON task_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    task_id IN (
      SELECT id 
      FROM tasks 
      WHERE entity_id IN (
        SELECT entity_id 
        FROM profiles 
        WHERE id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- 10. FIX FUNCTION SEARCH PATH MUTABILITY
-- =====================================================

ALTER FUNCTION update_licenses_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_tasks_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_documents_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_categories_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION seed_default_categories() SET search_path = public, pg_temp;
ALTER FUNCTION update_chat_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION generate_owner_id() SET search_path = public, pg_temp;
ALTER FUNCTION generate_entity_id() SET search_path = public, pg_temp;
ALTER FUNCTION mark_task_read_on_view() SET search_path = public, pg_temp;
ALTER FUNCTION update_entity_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION create_task_assignment_notifications() SET search_path = public, pg_temp;
ALTER FUNCTION create_task_completion_notifications() SET search_path = public, pg_temp;
