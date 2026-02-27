/*
  # Fix Guest User Signup Flow

  ## Overview
  This migration fixes the signup flow to allow guest users to create accounts
  without immediately creating an entity. Guest users will be properly associated
  with the entity that invited them.

  ## Changes

  1. **Update handle_new_user Trigger**
     - Add logic to detect if user is signing up via an invite
     - Check if there's a pending license invitation for the user's email
     - If invited as guest: Skip entity creation and link to inviting entity
     - If regular signup (owner): Create entity as normal

  2. **Entity Association for Guests**
     - Guest users get added to entity_memberships with role 'guest'
     - Their profile entity_id and current_entity_id point to inviting entity
     - Their profile role is set to 'user' (not 'owner')

  ## Security
     - Maintains RLS policies
     - Only associates users with entities they were invited to
     - Prevents unauthorized entity access

  ## Important Notes
     - Safe to run multiple times (uses CREATE OR REPLACE)
     - Backwards compatible with existing signups
     - Regular owner signups continue to work as before
*/

-- =====================================================
-- UPDATE HANDLE_NEW_USER TRIGGER
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
  pending_license RECORD;
  inviting_entity_id uuid;
BEGIN
  -- Check if user was invited (has a pending license)
  SELECT * INTO pending_license
  FROM public.licenses
  WHERE LOWER(invited_email) = LOWER(new.email)
    AND status = 'invited'
  LIMIT 1;

  -- Generate unique owner_id (always needed for profile)
  new_owner_id := generate_owner_id();

  IF pending_license IS NOT NULL THEN
    -- USER WAS INVITED - Handle as guest/admin
    
    -- Get the entity they're being invited to
    SELECT entity_id INTO inviting_entity_id
    FROM public.licenses
    WHERE id = pending_license.id;

    -- Insert profile with appropriate role
    INSERT INTO public.profiles (id, full_name, email, owner_id, role, entity_id, current_entity_id)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      new.email,
      new_owner_id,
      CASE 
        WHEN pending_license.license_type = 'admin' THEN 'accountant'
        ELSE 'user'
      END,
      inviting_entity_id,
      inviting_entity_id
    );

    -- Create entity membership
    INSERT INTO public.entity_memberships (user_id, entity_id, role, is_active)
    VALUES (
      new.id,
      inviting_entity_id,
      CASE 
        WHEN pending_license.license_type = 'admin' THEN 'accountant'
        ELSE 'guest'
      END,
      true
    );

    -- Update the license to link to the new user
    -- (This is also done in SignupForm but we do it here as backup)
    UPDATE public.licenses
    SET 
      user_id = new.id,
      status = 'active',
      accepted_at = NOW()
    WHERE id = pending_license.id;

  ELSE
    -- REGULAR SIGNUP - Create new entity for owner
    
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
  END IF;

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function that creates a profile and entity for new users. Detects if user was invited and handles guest/admin signup differently from owner signup.';
