/*
  # Implement SECURITY INVOKER for Enhanced RLS Security

  ## Overview
  This migration implements security hardening measures to prevent RLS bypass vulnerabilities
  and search_path exploitation attacks. All changes maintain backward compatibility while
  significantly enhancing the security posture of the database.

  ## 1. Convert License Usage Summary to SECURITY INVOKER
  
  ### What This Does:
  - Replaces the existing `license_usage_summary` view with SECURITY INVOKER behavior
  - The view now executes with the calling user's permissions, not the view owner's
  - Users can only see aggregated license data for licenses they own (respects RLS)
  - Prevents privilege escalation through view access
  
  ### Tables Affected:
  - `license_usage_summary` view - now respects RLS policies on licenses table
  
  ## 2. Create Admin License Summary View
  
  ### What This Does:
  - Creates `admin_license_usage_summary` view for administrative access
  - Uses SECURITY DEFINER to bypass RLS (intended for admin dashboards)
  - Explicitly restricted to service_role only via GRANT statements
  - Regular users cannot access this view
  
  ### Security Notes:
  - Only use this view in trusted admin contexts
  - Never expose this view to client applications
  - Service role credentials must be kept secure
  
  ## 3. Harden SECURITY DEFINER Trigger Functions
  
  ### What This Does:
  - Updates all trigger functions to use empty search_path (`SET search_path = ''`)
  - Converts all table/function references to fully qualified names (schema.object)
  - Prevents search_path exploitation attacks
  - Maintains SECURITY DEFINER (required for signup flow)
  
  ### Functions Updated:
  1. `handle_new_user()` - Profile creation during signup
  2. `handle_new_user_with_entity()` - Entity creation during signup
  3. `mark_task_read_on_view()` - Auto-mark tasks as read by creator
  4. `create_task_assignment_notifications()` - Task assignment notifications
  5. `create_task_completion_notifications()` - Task completion notifications
  
  ### Security Safeguards Applied:
  - Empty search_path prevents malicious schema injection
  - Fully qualified names prevent object spoofing
  - Functions remain minimal and focused on their single purpose
  - Error handling prevents information leakage
  
  ## 4. Function Permission Review
  
  ### What This Does:
  - Explicitly revokes direct execution permissions on SECURITY DEFINER functions
  - Ensures functions can only be triggered by their associated database triggers
  - Prevents unauthorized direct invocation via RPC calls
  
  ## Important Notes
  - All changes are backward compatible with existing application code
  - No data modifications, only security enhancements
  - Trigger functions continue to work exactly as before
  - Users may need to update admin interfaces to use new admin view
  - Connection pooling and password leak protection must be configured via dashboard
*/

-- ============================================================================
-- 1. CONVERT LICENSE USAGE SUMMARY TO SECURITY INVOKER
-- ============================================================================

-- Drop and recreate the view with security_invoker enabled
DROP VIEW IF EXISTS license_usage_summary;

-- Create view that respects RLS policies (SECURITY INVOKER)
-- Users can only see aggregated license data for licenses they own
CREATE VIEW license_usage_summary 
WITH (security_invoker = true) AS
SELECT 
  owner_id,
  COUNT(*) FILTER (WHERE status = 'active' AND license_type = 'admin') as active_admin_count,
  COUNT(*) FILTER (WHERE status = 'active' AND license_type = 'guest') as active_guest_count,
  COUNT(*) FILTER (WHERE status = 'archived' AND license_type = 'admin') as archived_admin_count,
  COUNT(*) FILTER (WHERE status = 'archived' AND license_type = 'guest') as archived_guest_count,
  COUNT(*) FILTER (WHERE status = 'invited' AND license_type = 'admin') as invited_admin_count,
  COUNT(*) FILTER (WHERE status = 'invited' AND license_type = 'guest') as invited_guest_count
FROM licenses
GROUP BY owner_id;

COMMENT ON VIEW license_usage_summary IS 
'User-facing view that respects RLS. Users only see their own license summaries. 
Uses SECURITY INVOKER to execute with calling user permissions.';

-- ============================================================================
-- 2. CREATE ADMIN LICENSE SUMMARY VIEW (SECURITY DEFINER)
-- ============================================================================

-- Create admin view that bypasses RLS for administrative purposes
-- This view is restricted to service_role only
CREATE OR REPLACE VIEW admin_license_usage_summary AS
SELECT 
  l.owner_id,
  p.email as owner_email,
  p.full_name as owner_name,
  COUNT(*) FILTER (WHERE l.status = 'active' AND l.license_type = 'admin') as active_admin_count,
  COUNT(*) FILTER (WHERE l.status = 'active' AND l.license_type = 'guest') as active_guest_count,
  COUNT(*) FILTER (WHERE l.status = 'archived' AND l.license_type = 'admin') as archived_admin_count,
  COUNT(*) FILTER (WHERE l.status = 'archived' AND l.license_type = 'guest') as archived_guest_count,
  COUNT(*) FILTER (WHERE l.status = 'invited' AND l.license_type = 'admin') as invited_admin_count,
  COUNT(*) FILTER (WHERE l.status = 'invited' AND l.license_type = 'guest') as invited_guest_count,
  COUNT(*) as total_licenses,
  MAX(l.updated_at) as last_license_activity
FROM licenses l
JOIN profiles p ON p.id = l.owner_id
GROUP BY l.owner_id, p.email, p.full_name;

COMMENT ON VIEW admin_license_usage_summary IS 
'Admin-only view that bypasses RLS for administrative reporting and dashboards. 
Restricted to service_role only. DO NOT expose to client applications.';

-- Revoke all default permissions
REVOKE ALL ON admin_license_usage_summary FROM PUBLIC;
REVOKE ALL ON admin_license_usage_summary FROM authenticated;
REVOKE ALL ON admin_license_usage_summary FROM anon;

-- Grant select only to service_role (for admin dashboards)
GRANT SELECT ON admin_license_usage_summary TO service_role;

-- ============================================================================
-- 3. HARDEN SECURITY DEFINER TRIGGER FUNCTIONS
-- ============================================================================

-- ============================================================================
-- 3.1 HARDEN handle_new_user() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create profile for new user with fully qualified table names
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email = 'admp3eople@gmail.com' THEN 'super_admin'::public.user_role
      ELSE 'user'::public.user_role
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, continue silently
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
'SECURITY DEFINER function for profile creation during signup. 
Uses empty search_path and fully qualified names to prevent search_path attacks.';

-- ============================================================================
-- 3.2 HARDEN handle_new_user_with_entity() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_with_entity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_owner_id text;
  new_entity_id text;
  new_entity_uuid uuid;
BEGIN
  -- Generate owner ID using fully qualified function name
  new_owner_id := public.generate_owner_id();
  
  -- Generate entity ID using fully qualified function name
  new_entity_id := public.generate_entity_id();
  
  -- Create entity with fully qualified table name
  INSERT INTO public.entities (entity_id, entity_name, owner_id)
  VALUES (new_entity_id, 'My Business', NEW.id)
  RETURNING id INTO new_entity_uuid;
  
  -- Update profile with owner_id and entity_id
  NEW.owner_id := new_owner_id;
  NEW.entity_id := new_entity_uuid;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but allow profile creation to continue
    RAISE WARNING 'Error creating entity for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user_with_entity() IS 
'SECURITY DEFINER function for entity creation during signup. 
Uses empty search_path and fully qualified names to prevent search_path attacks.';

-- ============================================================================
-- 3.3 HARDEN mark_task_read_on_view() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_task_read_on_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Automatically add creator to read_by when task is created
  IF TG_OP = 'INSERT' THEN
    NEW.read_by := array_append(NEW.read_by, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.mark_task_read_on_view() IS 
'SECURITY DEFINER function to auto-mark tasks as read by creator. 
Uses empty search_path to prevent search_path attacks.';

-- ============================================================================
-- 3.4 HARDEN create_task_assignment_notifications() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_task_assignment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_user_id uuid;
  creator_profile public.profiles%ROWTYPE;
BEGIN
  -- Get creator profile info for metadata using fully qualified table name
  SELECT * INTO creator_profile FROM public.profiles WHERE id = NEW.created_by;

  -- If this is a new task with assigned users (INSERT)
  IF TG_OP = 'INSERT' AND NEW.assigned_users IS NOT NULL AND array_length(NEW.assigned_users, 1) > 0 THEN
    FOREACH assigned_user_id IN ARRAY NEW.assigned_users
    LOOP
      -- Don't notify the creator
      IF assigned_user_id != NEW.created_by THEN
        INSERT INTO public.task_notifications (
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

  -- If this is an update and new users were added to assigned_users
  IF TG_OP = 'UPDATE' AND NEW.assigned_users IS NOT NULL THEN
    FOREACH assigned_user_id IN ARRAY NEW.assigned_users
    LOOP
      -- Only notify newly assigned users (not in OLD.assigned_users)
      IF (OLD.assigned_users IS NULL OR assigned_user_id != ALL(OLD.assigned_users))
         AND assigned_user_id != NEW.created_by THEN
        INSERT INTO public.task_notifications (
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

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block task creation/update
    RAISE WARNING 'Error creating task assignment notifications for task %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_task_assignment_notifications() IS 
'SECURITY DEFINER function to create notifications when tasks are assigned. 
Uses empty search_path and fully qualified names to prevent search_path attacks.';

-- ============================================================================
-- 3.5 HARDEN create_task_completion_notifications() FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_task_completion_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_user_id uuid;
  completer_profile public.profiles%ROWTYPE;
  current_user_id uuid;
BEGIN
  -- Get current user ID using fully qualified function
  current_user_id := auth.uid();
  
  -- Only proceed if task was just marked as completed
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    -- Get completer profile info using fully qualified table name
    SELECT * INTO completer_profile FROM public.profiles WHERE id = current_user_id;

    -- Notify all assigned users except the one who completed it
    IF NEW.assigned_users IS NOT NULL AND array_length(NEW.assigned_users, 1) > 0 THEN
      FOREACH assigned_user_id IN ARRAY NEW.assigned_users
      LOOP
        IF assigned_user_id != current_user_id THEN
          INSERT INTO public.task_notifications (
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
              'completer_id', current_user_id,
              'task_title', NEW.title
            )
          );
        END IF;
      END LOOP;
    END IF;

    -- Notify the creator if they didn't complete it themselves
    IF NEW.created_by != current_user_id THEN
      INSERT INTO public.task_notifications (
        task_id,
        user_id,
        notification_type,
        metadata
      ) VALUES (
        NEW.id,
        NEW.created_by,
        'completed',
        jsonb_build_object(
          'completer_name', completer_profile.full_name,
          'completer_id', current_user_id,
          'task_title', NEW.title
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block task update
    RAISE WARNING 'Error creating task completion notifications for task %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_task_completion_notifications() IS 
'SECURITY DEFINER function to create notifications when tasks are completed. 
Uses empty search_path and fully qualified names to prevent search_path attacks.';

-- ============================================================================
-- 4. REVOKE DIRECT EXECUTION PERMISSIONS ON SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Revoke direct execution from all roles to prevent RPC calls
-- These functions should only be executed via database triggers

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;

REVOKE ALL ON FUNCTION public.handle_new_user_with_entity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_with_entity() FROM authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_with_entity() FROM anon;

REVOKE ALL ON FUNCTION public.mark_task_read_on_view() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_task_read_on_view() FROM authenticated;
REVOKE ALL ON FUNCTION public.mark_task_read_on_view() FROM anon;

REVOKE ALL ON FUNCTION public.create_task_assignment_notifications() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_task_assignment_notifications() FROM authenticated;
REVOKE ALL ON FUNCTION public.create_task_assignment_notifications() FROM anon;

REVOKE ALL ON FUNCTION public.create_task_completion_notifications() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_task_completion_notifications() FROM authenticated;
REVOKE ALL ON FUNCTION public.create_task_completion_notifications() FROM anon;

-- ============================================================================
-- VERIFICATION QUERIES (FOR TESTING)
-- ============================================================================

-- Verify view security settings
-- Run: SELECT viewname, viewowner, security_invoker FROM pg_views WHERE viewname = 'license_usage_summary';

-- Verify function security settings
-- Run: SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname LIKE '%handle_new_user%';

-- Test license_usage_summary respects RLS
-- Run as regular user: SELECT * FROM license_usage_summary;
-- Should only return their own owner_id data

-- Test admin view is restricted
-- Run as regular user: SELECT * FROM admin_license_usage_summary;
-- Should return permission denied error
