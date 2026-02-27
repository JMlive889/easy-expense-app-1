/*
  # Create License Notes System

  1. New Tables
    - `license_notes`
      - `id` (uuid, primary key, auto-generated)
      - `license_id` (uuid, foreign key to licenses.id)
      - `author_id` (uuid, foreign key to profiles.id)
      - `note_content` (text, max 250 characters)
      - `created_at` (timestamptz, auto-set)
      - `updated_at` (timestamptz, auto-updated)

  2. Security
    - Enable RLS on `license_notes` table
    - Owners and Accountants can SELECT notes for their entity's licenses
    - Guests cannot view any notes
    - Owners and Accountants can INSERT notes
    - Note authors can UPDATE their own notes
    - Note authors can DELETE their own notes

  3. Performance
    - Index on `license_id` and `created_at` for efficient retrieval
    - Index on `author_id` for author lookups

  4. Important Notes
    - Notes are scoped to licenses within the user's current entity
    - Only admins (owners + accountants) can view and create notes
    - Authors can edit/delete their own notes
    - 250 character limit enforced at database level
*/

-- Create license_notes table
CREATE TABLE IF NOT EXISTS license_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_content text NOT NULL CHECK (char_length(note_content) <= 250 AND char_length(note_content) > 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_license_notes_license_id_created_at 
  ON license_notes(license_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_license_notes_author_id 
  ON license_notes(author_id);

-- Enable RLS
ALTER TABLE license_notes ENABLE ROW LEVEL SECURITY;

-- Allow Owners and Accountants to SELECT notes for licenses in their entity
-- Guests cannot see notes at all
CREATE POLICY "Admins can view notes for their entity licenses"
  ON license_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM licenses l
      INNER JOIN entity_memberships em ON em.entity_id = l.entity_id
      WHERE l.id = license_notes.license_id
      AND em.user_id = auth.uid()
      AND em.role IN ('owner', 'accountant')
    )
  );

-- Allow Owners and Accountants to INSERT notes
CREATE POLICY "Admins can create notes for their entity licenses"
  ON license_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM licenses l
      INNER JOIN entity_memberships em ON em.entity_id = l.entity_id
      WHERE l.id = license_notes.license_id
      AND em.user_id = auth.uid()
      AND em.role IN ('owner', 'accountant')
    )
  );

-- Allow note authors to UPDATE their own notes
CREATE POLICY "Authors can update their own notes"
  ON license_notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Allow note authors to DELETE their own notes
CREATE POLICY "Authors can delete their own notes"
  ON license_notes FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_license_notes_updated_at ON license_notes;
CREATE TRIGGER update_license_notes_updated_at
  BEFORE UPDATE ON license_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();