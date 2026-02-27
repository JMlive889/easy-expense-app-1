/*
  # Add Grok Analysis Field to Documents Table

  1. Changes
    - Add `grok_analysis` column (jsonb) to store AI-generated analysis from Grok Vision API
    - Field is nullable to support existing documents and documents that haven't been analyzed yet
    - Stores structured JSON data including extracted text, key-value pairs, and insights

  2. Use Cases
    - Store Grok Vision API analysis results for receipts and documents
    - Enable searching and querying of analyzed document data
    - Preserve analysis history for auditing and reference

  3. Notes
    - JSONB format allows for efficient querying and indexing of nested data
    - Analysis can be updated/reprocessed by overwriting the field
    - Field remains hidden in UI until populated with analysis data
*/

-- Add grok_analysis column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'grok_analysis'
  ) THEN
    ALTER TABLE documents ADD COLUMN grok_analysis jsonb;
  END IF;
END $$;

-- Create GIN index on grok_analysis for efficient JSONB queries
CREATE INDEX IF NOT EXISTS documents_grok_analysis_idx ON documents USING GIN (grok_analysis);