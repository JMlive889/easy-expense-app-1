/*
  # Fix handle_new_user Default Role to Owner

  ## Overview
  This migration corrects the `handle_new_user()` function to properly set the default
  role to 'owner' for new signups. The previous security hardening migration accidentally
  reverted this change back to 'user'.

  ## Changes
  1. Updates `handle_new_user()` function to:
     - Set default role to 'owner' instead of 'user'
     - Keep special case for super_admin email
     - Maintain all security hardening features (empty search_path, fully qualified names)
  
  ## Business Logic
  - Self-signup users → Owner (can manage subscriptions, billing, licenses)
  - License-invited users → User (belong to owner's entity, assigned via license system)
  - Super admin → Specific email gets super_admin role

  ## Security
  - Maintains SECURITY DEFINER with empty search_path
  - Preserves all security hardening from previous migrations
  - Uses fully qualified names to prevent search_path attacks
*/

-- Update handle_new_user() function with correct default role
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
      ELSE 'owner'::public.user_role
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
Uses empty search_path and fully qualified names to prevent search_path attacks.
New signups get owner role by default unless they are the super admin.';
