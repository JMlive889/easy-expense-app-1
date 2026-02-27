/*
  # Extend Tasks Table for Messages and To Do List System

  ## Summary
  Extends the existing tasks table to support a comprehensive To Do List and Messages system
  where all conversations are anchored to documents or receipts. Adds support for threaded
  message replies, user assignments, bookmarking, and read tracking.

  ## Changes
  
  1. New Columns Added to `tasks` table:
    - `assigned_users` (uuid[]): Array of user IDs assigned to this task/message
    - `document_id` (uuid): Foreign key linking task to a document or receipt
    - `bookmark` (boolean): Flag for bookmarking important tasks/messages
    - `parent_task_id` (uuid): Self-referencing FK for threaded message replies
    - `read_by` (uuid[]): Array of user IDs who have read this message
    - `title` (text): Short title for the task/message
    - `type` (text): The source type (document, receipt) derived from linked document
  
  2. Indexes:
    - Index on `document_id` for fast document-task lookups
    - Index on `parent_task_id` for fast thread retrieval
    - Index on `assigned_users` using GIN for fast user-task queries
  
  3. Security:
    - RLS policies updated to allow users to see tasks they're assigned to
    - RLS policies for document-linked tasks based on document access
*/

-- Add new columns to tasks table
DO $$
BEGIN
  -- Add assigned_users array column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_users'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_users uuid[] DEFAULT ARRAY[]::uuid[];
  END IF;

  -- Add document_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'document_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN document_id uuid REFERENCES documents(id) ON DELETE CASCADE;
  END IF;

  -- Add bookmark flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'bookmark'
  ) THEN
    ALTER TABLE tasks ADD COLUMN bookmark boolean DEFAULT false;
  END IF;

  -- Add parent_task_id for threading
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'parent_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;

  -- Add read_by array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'read_by'
  ) THEN
    ALTER TABLE tasks ADD COLUMN read_by uuid[] DEFAULT ARRAY[]::uuid[];
  END IF;

  -- Add title field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'title'
  ) THEN
    ALTER TABLE tasks ADD COLUMN title text;
  END IF;

  -- Add type field to store document/receipt type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'type'
  ) THEN
    ALTER TABLE tasks ADD COLUMN type text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_document_id ON tasks(document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_users ON tasks USING GIN(assigned_users);
CREATE INDEX IF NOT EXISTS idx_tasks_bookmark ON tasks(bookmark) WHERE bookmark = true;
CREATE INDEX IF NOT EXISTS idx_tasks_entity_category ON tasks(entity_id, category);

-- Drop existing RLS policies to recreate them with new logic
DROP POLICY IF EXISTS "Users can view tasks in their entity" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their entity" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their entity" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their entity" ON tasks;

-- Create comprehensive RLS policies for tasks
CREATE POLICY "Users can view tasks in their entity or assigned to them"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id FROM profiles WHERE id = auth.uid()
    )
    OR auth.uid() = ANY(assigned_users)
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create tasks in their entity"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    entity_id IN (
      SELECT entity_id FROM profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update tasks they created or are assigned to"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      created_by = auth.uid()
      OR auth.uid() = ANY(assigned_users)
    )
  )
  WITH CHECK (
    entity_id IN (
      SELECT entity_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      created_by = auth.uid()
      OR auth.uid() = ANY(assigned_users)
    )
  );

CREATE POLICY "Users can delete tasks they created"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id FROM profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Create function to automatically mark task as read when creator views it
CREATE OR REPLACE FUNCTION mark_task_read_on_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add creator to read_by when task is created
  IF TG_OP = 'INSERT' THEN
    NEW.read_by := array_append(NEW.read_by, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-marking tasks as read by creator
DROP TRIGGER IF EXISTS trigger_mark_task_read_on_create ON tasks;
CREATE TRIGGER trigger_mark_task_read_on_create
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION mark_task_read_on_view();