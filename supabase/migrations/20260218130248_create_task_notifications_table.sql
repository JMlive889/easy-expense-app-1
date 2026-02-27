/*
  # Create Task Notifications Table

  ## Summary
  Creates a comprehensive notifications system for tracking task and message assignments,
  replies, completions, and mentions. Supports both email and push notifications based
  on user preferences.

  ## Changes
  
  1. New Table: `task_notifications`
    - `id` (uuid, primary key): Unique notification identifier
    - `task_id` (uuid): Foreign key to the task that triggered the notification
    - `user_id` (uuid): User who should receive the notification
    - `notification_type` (text): Type of notification (assigned, replied, completed, mentioned)
    - `is_read` (boolean): Whether the user has read the notification
    - `sent_via_email` (boolean): Whether email notification was sent
    - `sent_via_push` (boolean): Whether push notification was sent
    - `metadata` (jsonb): Additional data (e.g., assigner name, reply content preview)
    - `created_at` (timestamp): When notification was created
  
  2. Trigger Function:
    - Automatically creates notifications when users are assigned to tasks
    - Creates notifications when someone replies to a message thread
  
  3. Security:
    - RLS enabled - users can only see their own notifications
    - Policies for select, insert, update operations
*/

-- Create task_notifications table
CREATE TABLE IF NOT EXISTS task_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (
    notification_type IN ('assigned', 'replied', 'completed', 'mentioned')
  ),
  is_read boolean DEFAULT false,
  sent_via_email boolean DEFAULT false,
  sent_via_push boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_notifications_user_id ON task_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_task_id ON task_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_is_read ON task_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_task_notifications_created_at ON task_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON task_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON task_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON task_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON task_notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to create notifications when users are assigned to tasks
CREATE OR REPLACE FUNCTION create_task_assignment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  assigned_user_id uuid;
  creator_profile profiles%ROWTYPE;
BEGIN
  -- Get creator profile info for metadata
  SELECT * INTO creator_profile FROM profiles WHERE id = NEW.created_by;

  -- If this is a new task with assigned users (INSERT)
  IF TG_OP = 'INSERT' AND NEW.assigned_users IS NOT NULL AND array_length(NEW.assigned_users, 1) > 0 THEN
    FOREACH assigned_user_id IN ARRAY NEW.assigned_users
    LOOP
      -- Don't notify the creator
      IF assigned_user_id != NEW.created_by THEN
        INSERT INTO task_notifications (
          task_id,
          user_id,
          notification_type,
          metadata
        ) VALUES (
          NEW.id,
          assigned_user_id,
          'assigned',
          jsonb_build_object(
            'assigner_name', creator_profile.full_name,
            'assigner_id', NEW.created_by,
            'task_title', NEW.title,
            'task_content', NEW.content
          )
        );
      END IF;
    END LOOP;
  END IF;

  -- If this is an update and new users were added (UPDATE)
  IF TG_OP = 'UPDATE' AND NEW.assigned_users IS NOT NULL THEN
    -- Find newly added users
    FOREACH assigned_user_id IN ARRAY NEW.assigned_users
    LOOP
      -- Check if this user wasn't in the old assigned_users list
      IF (OLD.assigned_users IS NULL OR NOT (assigned_user_id = ANY(OLD.assigned_users)))
         AND assigned_user_id != NEW.created_by THEN
        INSERT INTO task_notifications (
          task_id,
          user_id,
          notification_type,
          metadata
        ) VALUES (
          NEW.id,
          assigned_user_id,
          'assigned',
          jsonb_build_object(
            'assigner_name', creator_profile.full_name,
            'assigner_id', NEW.created_by,
            'task_title', NEW.title,
            'task_content', NEW.content
          )
        );
      END IF;
    END LOOP;
  END IF;

  -- If this is a reply (has parent_task_id), notify parent task participants
  IF NEW.parent_task_id IS NOT NULL THEN
    -- Notify the parent task creator
    INSERT INTO task_notifications (
      task_id,
      user_id,
      notification_type,
      metadata
    )
    SELECT
      NEW.id,
      t.created_by,
      'replied',
      jsonb_build_object(
        'replier_name', creator_profile.full_name,
        'replier_id', NEW.created_by,
        'reply_content', NEW.content,
        'parent_task_id', NEW.parent_task_id
      )
    FROM tasks t
    WHERE t.id = NEW.parent_task_id
      AND t.created_by != NEW.created_by;

    -- Notify all users assigned to parent task
    INSERT INTO task_notifications (
      task_id,
      user_id,
      notification_type,
      metadata
    )
    SELECT
      NEW.id,
      unnest(t.assigned_users),
      'replied',
      jsonb_build_object(
        'replier_name', creator_profile.full_name,
        'replier_id', NEW.created_by,
        'reply_content', NEW.content,
        'parent_task_id', NEW.parent_task_id
      )
    FROM tasks t
    WHERE t.id = NEW.parent_task_id
      AND t.assigned_users IS NOT NULL
      AND NOT (NEW.created_by = ANY(t.assigned_users));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task assignment notifications
DROP TRIGGER IF EXISTS trigger_task_assignment_notifications ON tasks;
CREATE TRIGGER trigger_task_assignment_notifications
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_assignment_notifications();

-- Function to create notification when task is completed
CREATE OR REPLACE FUNCTION create_task_completion_notifications()
RETURNS TRIGGER AS $$
DECLARE
  assigned_user_id uuid;
  completer_profile profiles%ROWTYPE;
BEGIN
  -- Only proceed if task was just marked as completed
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    -- Get completer profile info
    SELECT * INTO completer_profile FROM profiles WHERE id = auth.uid();

    -- Notify all assigned users except the one who completed it
    IF NEW.assigned_users IS NOT NULL AND array_length(NEW.assigned_users, 1) > 0 THEN
      FOREACH assigned_user_id IN ARRAY NEW.assigned_users
      LOOP
        IF assigned_user_id != auth.uid() THEN
          INSERT INTO task_notifications (
            task_id,
            user_id,
            notification_type,
            metadata
          ) VALUES (
            NEW.id,
            assigned_user_id,
            'completed',
            jsonb_build_object(
              'completer_name', completer_profile.full_name,
              'completer_id', auth.uid(),
              'task_title', NEW.title
            )
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task completion notifications
DROP TRIGGER IF EXISTS trigger_task_completion_notifications ON tasks;
CREATE TRIGGER trigger_task_completion_notifications
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_completion_notifications();