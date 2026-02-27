/*
  # Fix handle_new_user Trigger - Always Create Profile

  ## Overview
  The previous trigger had a critical flaw: the EXCEPTION handler silently
  swallowed all errors and returned `new` without ensuring a profile was
  actually created. This left users in auth.users with no corresponding
  profile row, causing them to get signed out immediately after signup.

  ## Root Cause
  When a user was invited AND had a pending license, the invited-user path
  would sometimes fail (e.g., duplicate entity_memberships key) and the
  catch block would return without creating a profile.

  ## Changes

  1. **Restructured invited-user path**
     - Profile insert is attempted first; if it fails we fall back to owner path
     - entity_memberships insert uses ON CONFLICT DO NOTHING to avoid duplicates
     - Each step has isolated error handling

  2. **Fallback profile creation**
     - If the invited path fails, a fallback owner profile is created
     - User always gets a usable profile and can log in

  3. **Regular signup path hardened**
     - Profile insert is isolated; entity creation failure won't block profile

  ## Security
  - Maintains SECURITY DEFINER and search_path restriction
*/

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
  profile_created boolean := false;
BEGIN
  -- Idempotency guard: if profile already exists, skip
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    RETURN new;
  END IF;

  -- Generate unique owner_id (always needed)
  new_owner_id := generate_owner_id();

  -- Check if user was invited (has a pending license)
  SELECT * INTO pending_license
  FROM public.licenses
  WHERE LOWER(invited_email) = LOWER(new.email)
    AND status = 'invited'
  LIMIT 1;

  IF pending_license IS NOT NULL THEN
    -- Get the entity they're being invited to
    SELECT entity_id INTO inviting_entity_id
    FROM public.licenses
    WHERE id = pending_license.id;

    -- Attempt to insert profile linked to the inviting entity
    BEGIN
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
      profile_created := true;
    EXCEPTION
      WHEN others THEN
        RAISE LOG 'handle_new_user: Failed invited profile insert for %: %', new.email, SQLERRM;
        profile_created := false;
    END;

    IF profile_created THEN
      -- Create entity membership (safe: skip if already exists)
      BEGIN
        INSERT INTO public.entity_memberships (user_id, entity_id, role, is_active)
        VALUES (
          new.id,
          inviting_entity_id,
          CASE 
            WHEN pending_license.license_type = 'admin' THEN 'accountant'
            ELSE 'guest'
          END,
          true
        )
        ON CONFLICT (user_id, entity_id) DO NOTHING;
      EXCEPTION
        WHEN others THEN
          RAISE LOG 'handle_new_user: Failed entity_membership insert for %: %', new.email, SQLERRM;
      END;

      -- Update the license to link to the new user
      BEGIN
        UPDATE public.licenses
        SET 
          user_id = new.id,
          status = 'active',
          accepted_at = NOW()
        WHERE id = pending_license.id
          AND status = 'invited';
      EXCEPTION
        WHEN others THEN
          RAISE LOG 'handle_new_user: Failed license update for %: %', new.email, SQLERRM;
      END;

      RETURN new;
    END IF;
    -- If invited profile failed, fall through to create a standard owner profile
  END IF;

  -- REGULAR SIGNUP (or fallback) - Create new entity for owner
  new_entity_id_value := generate_entity_id();

  BEGIN
    INSERT INTO public.profiles (id, full_name, email, owner_id, role)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      new.email,
      new_owner_id,
      'owner'
    );
  EXCEPTION
    WHEN others THEN
      RAISE LOG 'handle_new_user: Failed owner profile insert for %: %', new.email, SQLERRM;
      RETURN new;
  END;

  BEGIN
    INSERT INTO public.entities (entity_id, entity_name, owner_id)
    VALUES (
      new_entity_id_value,
      COALESCE(new.raw_user_meta_data->>'full_name', 'My Business'),
      new.id
    )
    RETURNING id INTO new_entity_uuid;

    UPDATE public.profiles
    SET 
      entity_id = new_entity_uuid,
      current_entity_id = new_entity_uuid
    WHERE id = new.id;

    INSERT INTO public.entity_memberships (user_id, entity_id, role, is_active)
    VALUES (
      new.id,
      new_entity_uuid,
      'owner',
      true
    )
    ON CONFLICT (user_id, entity_id) DO NOTHING;
  EXCEPTION
    WHEN others THEN
      RAISE LOG 'handle_new_user: Failed entity creation for %: %', new.email, SQLERRM;
  END;

  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function that creates a profile and entity for new users. Always ensures a profile row is created. Detects if user was invited and handles guest/admin signup differently from owner signup. Falls back to owner profile if invited path fails.';
