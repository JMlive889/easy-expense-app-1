/*
  # Add Role-Based Access Control System

  ## Overview
  This migration implements a comprehensive role-based access control (RBAC) system with five distinct roles.

  ## 1. New Types
    - `user_role` enum with values:
      - `super_admin`: Full system access, can manage all users and roles
      - `developer`: Technical access, can manage roles and system features
      - `owner`: Business owner access level
      - `accountant`: Financial/accounting access level
      - `user`: Standard user access (default)

  ## 2. Schema Changes
    - Add `role` column to `profiles` table
      - Type: `user_role` enum
      - Default: `user`
      - Not null constraint
    - Add index on `role` column for query performance
    - Assign `super_admin` role to initial admin user (admp3eople@gmail.com)

  ## 3. Security Updates
    - Update RLS policies:
      - All authenticated users can READ role information (visible in shared spaces)
      - Only `super_admin` and `developer` roles can UPDATE roles
      - Users can still update their own profile data (except role)
    - Update `handle_new_user` trigger function to set default role

  ## 4. Important Notes
    - Roles are visible to all authenticated users in shared spaces
    - Role changes are restricted to super admins and developers only
    - Default role for new signups is `user`
    - Initial Super Admin: admp3eople@gmail.com
*/

-- Create the user_role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'developer', 'owner', 'accountant', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add role column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Create index on role column for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Assign Super Admin role to initial admin user
DO $$
BEGIN
  -- Update existing user if they already exist
  UPDATE profiles 
  SET role = 'super_admin' 
  WHERE email = 'admp3eople@gmail.com';
  
  -- If no rows were updated, it means the user hasn't signed up yet
  -- The role will be set when they first sign up, then we can manually update it
  -- Or we can create a policy that auto-assigns based on email
END $$;

-- Update the handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- Auto-assign super_admin to the initial admin email
    CASE 
      WHEN NEW.email = 'admp3eople@gmail.com' THEN 'super_admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them with role support
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow all authenticated users to read ALL profiles (including roles)
-- This makes roles visible in shared spaces
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile data, but NOT their role
-- Only super_admin and developer can change roles
CREATE POLICY "Users can update own profile data"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND (
      -- If role is being changed, user must be super_admin or developer
      role = (SELECT role FROM profiles WHERE id = auth.uid()) OR
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'developer')
    )
  );

-- Allow super_admin and developer to update any profile's role
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'developer')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'developer')
  );

-- Grant necessary permissions
GRANT USAGE ON TYPE user_role TO authenticated;
