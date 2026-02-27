/*
  # Add Thumbnail Support to Documents

  1. Purpose
    - Enable fast loading of document previews in grid and list views
    - Store thumbnail URLs separately from full-size images
    - Optimize performance by loading smaller images for preview

  2. Changes
    - Add `thumbnail_path` column to documents table to store thumbnail file path
    - Thumbnails will be stored in documents storage bucket with _thumb suffix

  3. Notes
    - Thumbnails are optional and nullable
    - If thumbnail generation fails, full image will be used as fallback
    - Thumbnail path follows pattern: {folder}/{filename}_thumb.{ext}
*/

-- Add thumbnail_path column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'thumbnail_path'
  ) THEN
    ALTER TABLE documents ADD COLUMN thumbnail_path text;
  END IF;
END $$;

-- Create index for thumbnail lookups
CREATE INDEX IF NOT EXISTS idx_documents_thumbnail_path 
  ON documents(thumbnail_path) 
  WHERE thumbnail_path IS NOT NULL;
