/*
  # Fix Profile Entity Membership Trigger - Role Mapping

  ## Overview
  The create_profile_entity_membership trigger was passing profiles.role directly
  into entity_memberships.role, but the two tables have different role enums:
    - profiles.role: 'owner', 'accountant', 'user'
    - entity_memberships.role: 'owner', 'accountant', 'guest'

  The value 'user' in profiles must be mapped to 'guest' in entity_memberships.

  ## Fix
  Add role mapping in the trigger function so 'user' becomes 'guest'.
*/

CREATE OR REPLACE FUNCTION public.create_profile_entity_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  membership_role text;
BEGIN
  IF NEW.entity_id IS NOT NULL THEN
    membership_role := CASE NEW.role::text
      WHEN 'owner' THEN 'owner'
      WHEN 'accountant' THEN 'accountant'
      ELSE 'guest'
    END;

    INSERT INTO public.entity_memberships (user_id, entity_id, role, is_active)
    VALUES (
      NEW.id,
      NEW.entity_id,
      membership_role,
      true
    )
    ON CONFLICT (user_id, entity_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
