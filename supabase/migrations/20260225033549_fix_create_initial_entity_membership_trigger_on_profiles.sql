/*
  # Fix create_initial_entity_membership Trigger on Profiles

  ## Overview
  The create_initial_entity_membership_trigger on the profiles table fires
  after INSERT or UPDATE OF entity_id. However, the function was written
  for the entities table context (using NEW.owner_id as user_id and NEW.id
  as entity_id), which causes a type error when called from profiles because:
    - profiles.owner_id is TEXT (e.g., "MY000001"), not UUID
    - profiles.id is the user UUID, not the entity UUID

  ## Fix
  Replace the trigger on profiles with a corrected version that uses
  the proper column names for the profiles context:
    - user_id = NEW.id (the user's UUID)
    - entity_id = NEW.entity_id (the entity UUID being set on the profile)
  
  Uses ON CONFLICT DO NOTHING to be idempotent.

  ## Notes
  - The trigger on entities (if any) is separate and unaffected
  - Safe to run multiple times
*/

CREATE OR REPLACE FUNCTION public.create_profile_entity_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.entity_id IS NOT NULL THEN
    INSERT INTO public.entity_memberships (user_id, entity_id, role, is_active)
    VALUES (
      NEW.id,
      NEW.entity_id,
      NEW.role::text,
      true
    )
    ON CONFLICT (user_id, entity_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_initial_entity_membership_trigger ON public.profiles;

CREATE TRIGGER create_initial_entity_membership_trigger
  AFTER INSERT OR UPDATE OF entity_id ON public.profiles
  FOR EACH ROW
  WHEN (NEW.entity_id IS NOT NULL)
  EXECUTE FUNCTION create_profile_entity_membership();
