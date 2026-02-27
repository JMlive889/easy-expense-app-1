/*
  # Create Tasks Table for To-Do List System

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key) - Unique task identifier
      - `content` (text, required) - Task description/content
      - `category` (text, required) - Task category (general, docs, messages, receipts)
      - `is_completed` (boolean, default false) - Task completion status
      - `entity_id` (uuid, foreign key) - Links task to entity (shared workspace)
      - `created_by` (uuid, foreign key) - User who created the task
      - `created_at` (timestamptz) - Task creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `completed_at` (timestamptz, nullable) - Completion timestamp

  2. Security
    - Enable RLS on `tasks` table
    - Add policy for entity members to view all tasks in their entity
    - Add policy for entity members to create tasks in their entity
    - Add policy for entity members to update tasks in their entity
    - Add policy for entity members to delete tasks in their entity

  3. Performance
    - Add index on entity_id for fast entity-based queries
    - Add index on category for efficient filtering
    - Add composite index on (entity_id, is_completed) for common queries
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('general', 'docs', 'messages', 'receipts')),
  is_completed boolean DEFAULT false NOT NULL,
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Entity members can view all tasks in their entity
CREATE POLICY "Entity members can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = tasks.entity_id
    )
  );

-- Policy: Entity members can create tasks in their entity
CREATE POLICY "Entity members can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = tasks.entity_id
    )
    AND created_by = auth.uid()
  );

-- Policy: Entity members can update tasks in their entity
CREATE POLICY "Entity members can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = tasks.entity_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = tasks.entity_id
    )
  );

-- Policy: Entity members can delete tasks in their entity
CREATE POLICY "Entity members can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = tasks.entity_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_entity_id ON tasks(entity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_entity_completed ON tasks(entity_id, is_completed);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();