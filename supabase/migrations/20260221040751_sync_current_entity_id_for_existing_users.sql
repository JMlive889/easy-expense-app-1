/*
  # Sync Current Entity ID for Existing Users

  ## Overview
  Ensures all users who have an entity_id also have their current_entity_id set.
  This is necessary for the entity filtering to work correctly.

  ## Changes

  1. **Update Existing Profiles**
     - Set current_entity_id = entity_id for all users where current_entity_id is NULL
     - Only affects users who already have an entity_id

  2. **Update Trigger**
     - Modify the handle_new_user trigger to also set current_entity_id when creating entities

  ## Important Notes
     - Safe to run multiple times (idempotent)
     - Does not affect users without entities
     - Maintains data integrity
*/

-- =====================================================
-- SYNC CURRENT_ENTITY_ID FOR EXISTING USERS
-- =====================================================

-- Update all profiles where entity_id is set but current_entity_id is not
UPDATE profiles
SET current_entity_id = entity_id
WHERE entity_id IS NOT NULL
  AND current_entity_id IS NULL;

-- =====================================================
-- UPDATE HANDLE_NEW_USER TRIGGER TO SET CURRENT_ENTITY_ID
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  new_owner_id text;
  new_entity_id_value text;
  new_entity_uuid uuid;
BEGIN
  -- Generate unique owner_id
  new_owner_id := generate_owner_id();
  
  -- Generate unique entity_id
  new_entity_id_value := generate_entity_id();

  -- Insert the profile first
  INSERT INTO public.profiles (id, full_name, email, owner_id, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new_owner_id,
    'owner'
  );

  -- Create the entity
  INSERT INTO public.entities (entity_id, entity_name, owner_id)
  VALUES (
    new_entity_id_value,
    COALESCE(new.raw_user_meta_data->>'full_name', 'My Business'),
    new.id
  )
  RETURNING id INTO new_entity_uuid;

  -- Update the profile with entity_id AND current_entity_id
  UPDATE public.profiles
  SET 
    entity_id = new_entity_uuid,
    current_entity_id = new_entity_uuid
  WHERE id = new.id;

  -- Create entity membership
  INSERT INTO public.entity_memberships (user_id, entity_id, role, is_active)
  VALUES (
    new.id,
    new_entity_uuid,
    'owner',
    true
  );

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;
