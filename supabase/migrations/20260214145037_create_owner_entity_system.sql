/*
  # Owner and Entity ID System

  ## Overview
  Creates a comprehensive owner and entity tracking system with auto-generated IDs.
  Each user gets a permanent Owner ID (format: MY######) and is linked to an Entity
  with its own ID (format: TY######) and customizable name.

  ## New Tables
  
  ### `entities`
  - `id` (uuid, primary key) - Internal UUID
  - `entity_id` (text, unique) - Public-facing ID in format "TY110000"
  - `entity_name` (text) - Customizable entity name, max 100 characters
  - `owner_id` (uuid) - References profiles.id
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Modified Tables
  
  ### `profiles`
  - Added `owner_id` (text, unique) - Public-facing owner ID in format "MY110000"
  - Added `entity_id` (uuid) - References entities.id

  ## Sequences
  - `owner_id_seq` - Starts at 110000 for generating owner IDs
  - `entity_id_seq` - Starts at 110000 for generating entity IDs

  ## Functions
  - `generate_owner_id()` - Generates next owner ID in format MY######
  - `generate_entity_id()` - Generates next entity ID in format TY######
  - `handle_new_user_with_entity()` - Trigger function that creates entity and assigns IDs

  ## Security
  - RLS enabled on entities table
  - Users can read their own entity data
  - Only entity owners can update entity names
  - Secure policies prevent unauthorized access

  ## Data Migration
  - Existing users get owner ID "MY110000"
  - Default entity created with ID "TY110000" and name "My Business"
  - Automatic ID generation for future signups
*/

-- Create sequences for ID generation
CREATE SEQUENCE IF NOT EXISTS owner_id_seq START WITH 110000;
CREATE SEQUENCE IF NOT EXISTS entity_id_seq START WITH 110000;

-- Create function to generate owner ID
CREATE OR REPLACE FUNCTION generate_owner_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_id bigint;
  owner_id text;
BEGIN
  next_id := nextval('owner_id_seq');
  owner_id := 'MY' || lpad(next_id::text, 6, '0');
  RETURN owner_id;
END;
$$;

-- Create function to generate entity ID
CREATE OR REPLACE FUNCTION generate_entity_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_id bigint;
  entity_id text;
BEGIN
  next_id := nextval('entity_id_seq');
  entity_id := 'TY' || lpad(next_id::text, 6, '0');
  RETURN entity_id;
END;
$$;

-- Create entities table
CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text UNIQUE NOT NULL,
  entity_name text NOT NULL CHECK (char_length(entity_name) <= 100 AND char_length(entity_name) > 0),
  owner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN owner_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN entity_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_entity_id_fkey'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_entity_id_fkey
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'entities_owner_id_fkey'
  ) THEN
    ALTER TABLE entities
    ADD CONSTRAINT entities_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_entities_owner_id ON entities(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_entity_id ON profiles(entity_id);

-- Enable RLS on entities table
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own entity" ON entities;
DROP POLICY IF EXISTS "Users can update their own entity name" ON entities;
DROP POLICY IF EXISTS "System can insert entities" ON entities;

-- RLS Policies for entities table
CREATE POLICY "Users can view their own entity"
  ON entities
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own entity name"
  ON entities
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "System can insert entities"
  ON entities
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Create or replace trigger function for new users
CREATE OR REPLACE FUNCTION handle_new_user_with_entity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_owner_id text;
  new_entity_id text;
  new_entity_uuid uuid;
BEGIN
  -- Generate owner ID
  new_owner_id := generate_owner_id();
  
  -- Generate entity ID
  new_entity_id := generate_entity_id();
  
  -- Create entity
  INSERT INTO entities (entity_id, entity_name, owner_id)
  VALUES (new_entity_id, 'My Business', NEW.id)
  RETURNING id INTO new_entity_uuid;
  
  -- Update profile with owner_id and entity_id
  NEW.owner_id := new_owner_id;
  NEW.entity_id := new_entity_uuid;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_with_entity ON profiles;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created_with_entity
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_with_entity();

-- Backfill existing users
DO $$
DECLARE
  existing_profile RECORD;
  new_entity_uuid uuid;
BEGIN
  FOR existing_profile IN 
    SELECT id FROM profiles WHERE owner_id IS NULL
  LOOP
    -- Create entity for existing user
    INSERT INTO entities (entity_id, entity_name, owner_id)
    VALUES ('TY110000', 'My Business', existing_profile.id)
    RETURNING id INTO new_entity_uuid;
    
    -- Update profile with owner_id and entity_id
    UPDATE profiles
    SET 
      owner_id = 'MY110000',
      entity_id = new_entity_uuid
    WHERE id = existing_profile.id;
  END LOOP;
END $$;

-- Create function to update entity updated_at timestamp
CREATE OR REPLACE FUNCTION update_entity_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_entities_updated_at ON entities;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_entity_updated_at();