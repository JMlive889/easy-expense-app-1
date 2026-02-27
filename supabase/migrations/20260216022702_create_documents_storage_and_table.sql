/*
  # Create Documents Storage Bucket and Table

  ## Storage Setup
  1. Creates private 'documents' storage bucket
  2. Configures max file size to 25MB (26214400 bytes)
  3. Sets allowed MIME types: application/pdf, image/jpeg, image/png, image/heic
  4. Implements storage policies for secure file access

  ## New Tables
  - `documents`
    - `id` (uuid, primary key) - Unique document identifier
    - `user_id` (uuid, foreign key) - References profiles table, document owner
    - `file_path` (text) - Storage path in format {user_id}/{year}/{month}/{uuid}-{filename}
    - `display_name` (text) - User-friendly display name
    - `original_name` (text) - Original filename from upload
    - `mime_type` (text) - File MIME type for validation
    - `file_size` (bigint) - File size in bytes
    - `type` (text) - Document type/category
    - `status` (text, default 'pending') - Processing status
    - `bookmark` (boolean, default false) - Bookmark flag
    - `due_date` (timestamptz) - Optional due date
    - `notes` (text) - User notes
    - `tags` (text[]) - Document tags array
    - `shared_with` (uuid[]) - Array of user IDs with access
    - `todo_id` (uuid) - Optional reference to tasks table
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on documents table
  - Users can read/update/delete their own documents
  - Users can read documents shared with them
  - Storage policies enforce file access based on ownership and sharing
  - Automatic updated_at trigger on modifications

  ## Indexes
  - Index on user_id for fast owner lookups
  - GIN index on shared_with for efficient array queries
  - Index on created_at for sorting
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  26214400,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  display_name text NOT NULL,
  original_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  type text,
  status text DEFAULT 'pending' NOT NULL,
  bookmark boolean DEFAULT false NOT NULL,
  due_date timestamptz,
  notes text,
  tags text[],
  shared_with uuid[],
  todo_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_shared_with_idx ON documents USING GIN(shared_with);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS documents_todo_id_idx ON documents(todo_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own documents
CREATE POLICY "Users can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can read documents shared with them
CREATE POLICY "Users can read shared documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(shared_with));

-- Policy: Users can create documents for themselves
CREATE POLICY "Users can create own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage Policies for documents bucket

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read their own files
CREATE POLICY "Users can read own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read files shared with them
CREATE POLICY "Users can read shared files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.file_path = storage.objects.name
      AND auth.uid() = ANY(documents.shared_with)
    )
  );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );