/*
  # Add Multi-Image Gallery Support for Documents

  1. Schema Changes
    - Add `parent_document_id` (uuid, nullable) to link child images to parent document
    - Add `display_order` (integer, default 0) to control image sequence in gallery
    - Add foreign key constraint from parent_document_id to documents.id
    - Add index on parent_document_id for efficient queries of related images

  2. Security
    - Update RLS policies to ensure users can access child images if they can access parent
    - Child images inherit access permissions from their parent document

  3. Migration Safety
    - Uses IF NOT EXISTS to prevent errors on re-runs
    - Non-destructive changes only (adding columns, not removing data)
    - Default values ensure existing documents work without modification

  ## Important Notes
  - Existing documents remain unchanged (parent_document_id = NULL means standalone)
  - display_order = 0 for first/main image in a gallery
  - Parent documents should not have a parent_document_id (top-level only)
*/

-- Add parent_document_id column to link images together
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'parent_document_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN parent_document_id uuid REFERENCES documents(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add display_order to control image sequence in gallery
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE documents ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Create index for efficient queries of related images
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id ON documents(parent_document_id);

-- Create RLS policies for child images
-- Users can view child images if they can view the parent document
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'documents' AND policyname = 'Users can view child images of accessible documents'
  ) THEN
    CREATE POLICY "Users can view child images of accessible documents"
      ON documents FOR SELECT
      TO authenticated
      USING (
        parent_document_id IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM documents parent
          WHERE parent.id = documents.parent_document_id
          AND parent.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can insert child images if they own the parent document
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'documents' AND policyname = 'Users can add child images to their documents'
  ) THEN
    CREATE POLICY "Users can add child images to their documents"
      ON documents FOR INSERT
      TO authenticated
      WITH CHECK (
        parent_document_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM documents parent
          WHERE parent.id = documents.parent_document_id
          AND parent.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can update child images if they own the parent document
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'documents' AND policyname = 'Users can update child images of their documents'
  ) THEN
    CREATE POLICY "Users can update child images of their documents"
      ON documents FOR UPDATE
      TO authenticated
      USING (
        parent_document_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM documents parent
          WHERE parent.id = documents.parent_document_id
          AND parent.user_id = auth.uid()
        )
      )
      WITH CHECK (
        parent_document_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM documents parent
          WHERE parent.id = documents.parent_document_id
          AND parent.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can delete child images if they own the parent document
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'documents' AND policyname = 'Users can delete child images of their documents'
  ) THEN
    CREATE POLICY "Users can delete child images of their documents"
      ON documents FOR DELETE
      TO authenticated
      USING (
        parent_document_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM documents parent
          WHERE parent.id = documents.parent_document_id
          AND parent.user_id = auth.uid()
        )
      );
  END IF;
END $$;