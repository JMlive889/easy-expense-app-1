/*
  # Fix Orphaned User Profile - myumbrellakingdom@gmail.com

  ## Overview
  User 85f8bbfe-0af7-4dd2-b387-2d828cb8b468 (myumbrellakingdom@gmail.com)
  was created in auth.users but the handle_new_user trigger silently failed,
  leaving no profile row. The user was invited as a guest to entity
  6492364f-d50c-47ae-b384-3a9c6f30d87a (D30 Output).

  ## Changes
  1. Creates the missing profile linked to the D30 Output entity
  2. The profile trigger auto-creates the entity_membership with 'guest' role
  3. Updates the pending license to 'active' status

  ## Notes
  - Uses IF NOT EXISTS guard to be safe if re-run
*/

DO $$
DECLARE
  orphaned_user_id uuid := '85f8bbfe-0af7-4dd2-b387-2d828cb8b468';
  inviting_entity_id uuid := '6492364f-d50c-47ae-b384-3a9c6f30d87a';
  license_id uuid := 'bb18f075-9e33-4820-9b3c-4429320e75b3';
  new_owner_id text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = orphaned_user_id) THEN
    new_owner_id := generate_owner_id();

    INSERT INTO public.profiles (id, full_name, email, owner_id, role, entity_id, current_entity_id)
    VALUES (
      orphaned_user_id,
      'GuestJenn Here',
      'myumbrellakingdom@gmail.com',
      new_owner_id,
      'user',
      inviting_entity_id,
      inviting_entity_id
    );
  END IF;

  UPDATE public.licenses
  SET
    user_id = orphaned_user_id,
    status = 'active',
    accepted_at = NOW()
  WHERE id = license_id
    AND status = 'invited';
END $$;
