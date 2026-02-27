/*
  # Upgrade Existing Test Users to Owner Role

  ## Overview
  This migration upgrades all existing users with 'user' role to 'owner' role.
  This is specifically for the testing phase where all self-signup users should be owners.

  ## Changes
  1. Updates all profiles with role='user' to role='owner'
  2. Only affects existing test users (will not affect future invited users through license system)

  ## Business Logic
  - Self-signup users → Owner role (can manage their own entities, subscriptions, billing)
  - License-invited users → User role (belong to owner's entity, no billing access)
  - This migration only affects the existing test accounts
  
  ## Security
  - Maintains all existing RLS policies
  - Does not modify super_admin or other roles
  - Only upgrades 'user' role to 'owner' role
*/

-- Upgrade all existing 'user' role profiles to 'owner' role
UPDATE public.profiles
SET role = 'owner'::user_role,
    updated_at = now()
WHERE role = 'user'::user_role;
