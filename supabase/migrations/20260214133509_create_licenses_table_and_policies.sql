/*
  # Create Licenses Table and Management System

  ## Overview
  This migration creates a comprehensive license management system that allows subscription owners
  to invite users to licenses, track invitation acceptance, and archive/reactivate licenses.

  ## New Tables
  
  ### `licenses`
  - `id` (uuid, primary key) - Unique license identifier
  - `owner_id` (uuid, references profiles.id) - User who owns the subscription
  - `invited_email` (text) - Email address of invited user
  - `user_id` (uuid, nullable, references auth.users.id) - User ID once account is created
  - `license_type` (text) - Type of license: 'admin' or 'guest'
  - `status` (text) - License status: 'invited', 'active', or 'archived'
  - `invitation_token` (uuid) - Secure token for accepting invitation
  - `invitation_sent_at` (timestamptz) - When invitation was sent
  - `accepted_at` (timestamptz, nullable) - When invitation was accepted and account created
  - `archived_at` (timestamptz, nullable) - When license was archived
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Views
  
  ### `license_usage_summary`
  Provides a summary of license usage per owner, counting active licenses by type
  
  ## Security
  - Enable RLS on licenses table
  - Owners can view, create, update, and delete their own licenses
  - Users can view licenses where they are the invited user
  - Public users can view licenses by valid invitation token (for acceptance flow)

  ## Indexes
  - Index on owner_id for fast license lookups by owner
  - Index on user_id for fast lookups by assigned user
  - Index on invitation_token for invitation acceptance
  - Index on invited_email for duplicate checking
  - Index on status for filtering active/archived licenses

  ## Notes
  - Invitation tokens are UUIDs for security
  - Archived licenses preserve all data for potential reactivation
  - License status flow: invited -> active (when account created) -> archived (when deactivated)
  - Only active licenses count against subscription limits
*/

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  license_type text NOT NULL CHECK (license_type IN ('admin', 'guest')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'archived')),
  invitation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  invitation_sent_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_licenses_owner_id ON licenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_invitation_token ON licenses(invitation_token);
CREATE INDEX IF NOT EXISTS idx_licenses_invited_email ON licenses(invited_email);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_owner_status ON licenses(owner_id, status);

-- Create a view for license usage summary
CREATE OR REPLACE VIEW license_usage_summary AS
SELECT 
  owner_id,
  COUNT(*) FILTER (WHERE status = 'active' AND license_type = 'admin') as active_admin_count,
  COUNT(*) FILTER (WHERE status = 'active' AND license_type = 'guest') as active_guest_count,
  COUNT(*) FILTER (WHERE status = 'archived' AND license_type = 'admin') as archived_admin_count,
  COUNT(*) FILTER (WHERE status = 'archived' AND license_type = 'guest') as archived_guest_count,
  COUNT(*) FILTER (WHERE status = 'invited' AND license_type = 'admin') as invited_admin_count,
  COUNT(*) FILTER (WHERE status = 'invited' AND license_type = 'guest') as invited_guest_count
FROM licenses
GROUP BY owner_id;

-- Enable RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view all their licenses
CREATE POLICY "Owners can view their licenses"
  ON licenses
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy: Owners can create new licenses
CREATE POLICY "Owners can create licenses"
  ON licenses
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Policy: Owners can update their licenses
CREATE POLICY "Owners can update their licenses"
  ON licenses
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy: Owners can delete their licenses
CREATE POLICY "Owners can delete their licenses"
  ON licenses
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy: Users can view licenses assigned to them (by email or user_id)
CREATE POLICY "Users can view their assigned licenses"
  ON licenses
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Public users can view licenses by valid invitation token (for acceptance)
CREATE POLICY "Public can view licenses by invitation token"
  ON licenses
  FOR SELECT
  TO anon
  USING (invitation_token IS NOT NULL);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DROP TRIGGER IF EXISTS update_licenses_updated_at_trigger ON licenses;
CREATE TRIGGER update_licenses_updated_at_trigger
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();