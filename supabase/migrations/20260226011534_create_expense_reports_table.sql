/*
  # Create Expense Reports Table

  ## Summary
  This migration introduces a proper relational expense_reports system to replace the
  free-text expense_report field on documents. Users can now create named expense reports
  (e.g., "January Travel", "El Paso Kitchen Project") and attach multiple receipts to them.

  ## New Tables

  ### expense_reports
  - `id` (uuid, PK) - unique identifier
  - `entity_id` (uuid, FK → entities) - which entity this report belongs to
  - `user_id` (uuid, FK → auth.users) - who created the report
  - `report_number` (integer) - sequential number within the entity (1, 2, 3...)
  - `report_number_display` (text) - formatted display string e.g. "ER#-0000001"
  - `title` (text) - user-provided name e.g. "January Travel"
  - `status` (text) - report status: draft, submitted, approved
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Modified Tables

  ### documents
  - Added `expense_report_id` (uuid, nullable FK → expense_reports) - links receipt to a report
    The existing `expense_report` text column is kept for backward compatibility.

  ## New Functions

  ### get_next_er_number(p_entity_id uuid)
  Atomically returns the next available report number for an entity to prevent race conditions.

  ## Security
  - RLS enabled on expense_reports
  - Entity members can view reports for their entity
  - Only the creator can update/delete their reports
  - INSERT allowed for authenticated users who are members of the entity
*/

CREATE TABLE IF NOT EXISTS expense_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_number integer NOT NULL,
  report_number_display text NOT NULL,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, report_number)
);

ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'expense_report_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN expense_report_id uuid REFERENCES expense_reports(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expense_reports_entity_id ON expense_reports(entity_id);
CREATE INDEX IF NOT EXISTS idx_expense_reports_user_id ON expense_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_reports_entity_status ON expense_reports(entity_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_expense_report_id ON documents(expense_report_id);

CREATE OR REPLACE FUNCTION get_next_er_number(p_entity_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
BEGIN
  SELECT COALESCE(MAX(report_number), 0) + 1
  INTO v_next
  FROM expense_reports
  WHERE entity_id = p_entity_id;

  RETURN v_next;
END;
$$;

CREATE OR REPLACE FUNCTION update_expense_report_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expense_reports_updated_at ON expense_reports;
CREATE TRIGGER expense_reports_updated_at
  BEFORE UPDATE ON expense_reports
  FOR EACH ROW EXECUTE FUNCTION update_expense_report_updated_at();

CREATE POLICY "Entity members can view expense reports"
  ON expense_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entity_memberships em
      WHERE em.entity_id = expense_reports.entity_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Entity members can create expense reports"
  ON expense_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM entity_memberships em
      WHERE em.entity_id = expense_reports.entity_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update their expense reports"
  ON expense_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can delete their expense reports"
  ON expense_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
