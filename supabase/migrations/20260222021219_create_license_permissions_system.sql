/*
  # Create License Permissions System

  1. New Tables
    - `license_permissions`
      - `id` (uuid, primary key)
      - `license_id` (uuid, foreign key to licenses, unique)
      - `can_manage_categories` (boolean, default false)
      - `can_view_reports` (boolean, default false)
      - `can_enter_multiple_items` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `license_permissions` table with SECURITY INVOKER
    - Add policy for owners to view permissions for their licenses
    - Add policy for owners to insert/update permissions
    - Add policy for license users to view their own permissions

  3. Functions & Triggers
    - Create trigger to automatically create default permissions for new licenses
    - Create function to check user permissions
    - Add updated_at trigger

  4. Indexes
    - Add index on license_id for fast lookups
*/

-- Create license_permissions table
CREATE TABLE IF NOT EXISTS license_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL UNIQUE REFERENCES licenses(id) ON DELETE CASCADE,
  can_manage_categories boolean DEFAULT false NOT NULL,
  can_view_reports boolean DEFAULT false NOT NULL,
  can_enter_multiple_items boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_license_permissions_license_id 
  ON license_permissions(license_id);

-- Enable RLS with SECURITY INVOKER
ALTER TABLE license_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_permissions FORCE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can view permissions for their licenses" ON license_permissions;
DROP POLICY IF EXISTS "Owners can insert permissions for their licenses" ON license_permissions;
DROP POLICY IF EXISTS "Owners can update permissions for their licenses" ON license_permissions;
DROP POLICY IF EXISTS "Users can view their own license permissions" ON license_permissions;

-- Policy: Owners can view permissions for their licenses
CREATE POLICY "Owners can view permissions for their licenses"
  ON license_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM licenses
      WHERE licenses.id = license_permissions.license_id
      AND licenses.owner_id = auth.uid()
    )
  );

-- Policy: Owners can insert permissions for their licenses
CREATE POLICY "Owners can insert permissions for their licenses"
  ON license_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM licenses
      WHERE licenses.id = license_permissions.license_id
      AND licenses.owner_id = auth.uid()
    )
  );

-- Policy: Owners can update permissions for their licenses
CREATE POLICY "Owners can update permissions for their licenses"
  ON license_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM licenses
      WHERE licenses.id = license_permissions.license_id
      AND licenses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM licenses
      WHERE licenses.id = license_permissions.license_id
      AND licenses.owner_id = auth.uid()
    )
  );

-- Policy: Users can view their own license permissions
CREATE POLICY "Users can view their own license permissions"
  ON license_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM licenses
      WHERE licenses.id = license_permissions.license_id
      AND licenses.user_id = auth.uid()
    )
  );

-- Function: Create default permissions for new licenses
CREATE OR REPLACE FUNCTION create_default_license_permissions()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO license_permissions (license_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger: Auto-create permissions when license is created
DROP TRIGGER IF EXISTS trigger_create_default_license_permissions ON licenses;
CREATE TRIGGER trigger_create_default_license_permissions
  AFTER INSERT ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_license_permissions();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_license_permissions_updated_at()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: Update updated_at on permission changes
DROP TRIGGER IF EXISTS trigger_update_license_permissions_updated_at ON license_permissions;
CREATE TRIGGER trigger_update_license_permissions_updated_at
  BEFORE UPDATE ON license_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_license_permissions_updated_at();

-- Function: Get user's permissions for current entity
CREATE OR REPLACE FUNCTION get_user_license_permissions(user_id_param uuid, entity_id_param uuid)
RETURNS TABLE (
  can_manage_categories boolean,
  can_view_reports boolean,
  can_enter_multiple_items boolean
)
SECURITY INVOKER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is owner (has full permissions)
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id_param
    AND role = 'owner'
  ) THEN
    RETURN QUERY SELECT true, true, true;
    RETURN;
  END IF;

  -- Get permissions from license
  RETURN QUERY
  SELECT 
    lp.can_manage_categories,
    lp.can_view_reports,
    lp.can_enter_multiple_items
  FROM license_permissions lp
  INNER JOIN licenses l ON l.id = lp.license_id
  WHERE l.user_id = user_id_param
  AND l.status = 'active'
  LIMIT 1;
END;
$$;

-- Create default permissions for existing licenses
INSERT INTO license_permissions (license_id)
SELECT id FROM licenses
WHERE id NOT IN (SELECT license_id FROM license_permissions)
ON CONFLICT (license_id) DO NOTHING;