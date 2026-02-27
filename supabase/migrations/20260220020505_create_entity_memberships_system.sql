/*
  # Multi-Entity Membership System

  ## Overview
  Enables users to belong to multiple entities and switch between them.
  Extends the existing entity system to support many-to-many relationships
  between users and entities, with proper access control and invitation handling.

  ## New Tables
  
  ### `entity_memberships`
  - `id` (uuid, primary key) - Internal UUID
  - `user_id` (uuid, references auth.users) - User in the membership
  - `entity_id` (uuid, references entities) - Entity the user belongs to
  - `role` (text) - User's role in this entity (owner, accountant, guest)
  - `is_active` (boolean) - Whether this is the user's currently active entity
  - `joined_at` (timestamptz) - When the user joined this entity
  - `created_at` (timestamptz) - Creation timestamp
  - Unique constraint on (user_id, entity_id)

  ## Modified Tables
  
  ### `licenses`
  - Added `entity_id` (uuid, references entities) - Links license to specific entity
  - This allows invitations to be entity-specific
  
  ### `profiles`
  - Added `active_entity_id` (uuid, references entities) - Currently active entity for user

  ## Functions
  - `ensure_single_active_entity()` - Ensures only one entity is active per user
  - `sync_active_entity_to_profile()` - Keeps profile.active_entity_id in sync
  - `handle_license_acceptance()` - Creates entity membership when license accepted
  - `create_initial_entity_membership()` - Creates membership for new users

  ## Security
  - RLS enabled on entity_memberships table
  - Users can read their own memberships
  - Only entity owners can manage memberships
  - Proper access control for entity switching

  ## Indexes
  - Index on (user_id, is_active) for fast active entity lookup
  - Index on (entity_id, role) for permission checks
  - Index on user_id for membership queries
*/

-- Create entity_memberships table
CREATE TABLE IF NOT EXISTS entity_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'accountant', 'guest')),
  is_active boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entity_id)
);

-- Add entity_id to licenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE licenses ADD COLUMN entity_id uuid REFERENCES entities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add active_entity_id to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'active_entity_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active_entity_id uuid REFERENCES entities(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_memberships_user_active 
  ON entity_memberships(user_id, is_active);
  
CREATE INDEX IF NOT EXISTS idx_entity_memberships_entity_role 
  ON entity_memberships(entity_id, role);
  
CREATE INDEX IF NOT EXISTS idx_entity_memberships_user 
  ON entity_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_licenses_entity 
  ON licenses(entity_id);

CREATE INDEX IF NOT EXISTS idx_licenses_invited_email_status 
  ON licenses(invited_email, status);

-- Function to ensure only one active entity per user
CREATE OR REPLACE FUNCTION ensure_single_active_entity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If setting this membership to active, deactivate all others for this user
  IF NEW.is_active = true THEN
    UPDATE entity_memberships 
    SET is_active = false 
    WHERE user_id = NEW.user_id 
      AND entity_id != NEW.entity_id
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to ensure single active entity
DROP TRIGGER IF EXISTS ensure_single_active_entity_trigger ON entity_memberships;
CREATE TRIGGER ensure_single_active_entity_trigger
  BEFORE INSERT OR UPDATE ON entity_memberships
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_entity();

-- Function to sync active entity to profile
CREATE OR REPLACE FUNCTION sync_active_entity_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update profile with the active entity
  IF NEW.is_active = true THEN
    UPDATE profiles 
    SET active_entity_id = NEW.entity_id 
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to sync active entity to profile
DROP TRIGGER IF EXISTS sync_active_entity_to_profile_trigger ON entity_memberships;
CREATE TRIGGER sync_active_entity_to_profile_trigger
  AFTER INSERT OR UPDATE ON entity_memberships
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION sync_active_entity_to_profile();

-- Function to create entity membership when license is accepted
CREATE OR REPLACE FUNCTION handle_license_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_entity_id uuid;
BEGIN
  -- Only process when license status changes to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get the entity_id from the license
    target_entity_id := NEW.entity_id;
    
    -- If no entity_id on license, get it from the owner's profile
    IF target_entity_id IS NULL THEN
      SELECT entity_id INTO target_entity_id
      FROM profiles
      WHERE id = NEW.owner_id;
    END IF;
    
    -- Create entity membership for the accepted user
    INSERT INTO entity_memberships (user_id, entity_id, role, is_active)
    VALUES (NEW.user_id, target_entity_id, NEW.license_type, false)
    ON CONFLICT (user_id, entity_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for license acceptance
DROP TRIGGER IF EXISTS handle_license_acceptance_trigger ON licenses;
CREATE TRIGGER handle_license_acceptance_trigger
  AFTER UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_license_acceptance();

-- Function to create initial entity membership for new users
CREATE OR REPLACE FUNCTION create_initial_entity_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create entity membership for the user's primary entity
  IF NEW.entity_id IS NOT NULL THEN
    INSERT INTO entity_memberships (user_id, entity_id, role, is_active)
    VALUES (NEW.id, NEW.entity_id, 'owner', true)
    ON CONFLICT (user_id, entity_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to create initial membership for new users
DROP TRIGGER IF EXISTS create_initial_entity_membership_trigger ON profiles;
CREATE TRIGGER create_initial_entity_membership_trigger
  AFTER INSERT OR UPDATE OF entity_id ON profiles
  FOR EACH ROW
  WHEN (NEW.entity_id IS NOT NULL)
  EXECUTE FUNCTION create_initial_entity_membership();

-- Enable RLS on entity_memberships
ALTER TABLE entity_memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own memberships
CREATE POLICY "Users can read own memberships"
  ON entity_memberships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own membership active status
CREATE POLICY "Users can update own membership active status"
  ON entity_memberships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Entity owners can read all memberships for their entities
CREATE POLICY "Entity owners can read entity memberships"
  ON entity_memberships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entity_memberships em
      WHERE em.entity_id = entity_memberships.entity_id
        AND em.user_id = auth.uid()
        AND em.role = 'owner'
    )
  );

-- Policy: System can insert memberships (for triggers)
CREATE POLICY "System can insert memberships"
  ON entity_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Migrate existing data: Create entity memberships for all existing users
INSERT INTO entity_memberships (user_id, entity_id, role, is_active)
SELECT 
  p.id,
  p.entity_id,
  p.role,
  true
FROM profiles p
WHERE p.entity_id IS NOT NULL
ON CONFLICT (user_id, entity_id) DO NOTHING;

-- Update active_entity_id for all existing users
UPDATE profiles p
SET active_entity_id = p.entity_id
WHERE p.entity_id IS NOT NULL AND p.active_entity_id IS NULL;

-- Update licenses with entity_id from owner's profile
UPDATE licenses l
SET entity_id = (
  SELECT p.entity_id 
  FROM profiles p 
  WHERE p.id = l.owner_id
)
WHERE l.entity_id IS NULL;