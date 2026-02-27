/*
  # Create Saved Reports System

  1. New Tables
    - `saved_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `entity_id` (uuid, references entities)
      - `report_name` (text, name of the saved report)
      - `visible_columns` (jsonb, array of column names to display)
      - `column_order` (jsonb, array defining the order of columns)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_reports` table
    - Add policies for authenticated users to:
      - Read their own entity's saved reports
      - Create saved reports for their entity
      - Update their own saved reports
      - Delete their own saved reports

  3. Indexes
    - Add index on user_id for performance
    - Add index on entity_id for performance
*/

CREATE TABLE IF NOT EXISTS saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  report_name text NOT NULL CHECK (char_length(report_name) > 0 AND char_length(report_name) <= 100),
  visible_columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  column_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view saved reports for their entity"
  ON saved_reports
  FOR SELECT
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM entity_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create saved reports for their entity"
  ON saved_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    entity_id IN (
      SELECT entity_id 
      FROM entity_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their own saved reports"
  ON saved_reports
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved reports"
  ON saved_reports
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_reports_user_id ON saved_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_entity_id ON saved_reports(entity_id);