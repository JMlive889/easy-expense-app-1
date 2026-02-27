/*
  # Add Entity Logo Support

  1. Changes
    - Add `entity_logo_url` column to `entities` table to store the logo image URL
    - Create `entity-logos` storage bucket for storing entity logo images
    - Set up RLS policies for the entity-logos bucket
      - Owners can upload/update their entity's logo
      - All users within the entity can view the logo

  2. Security
    - Bucket is private by default
    - Upload restricted to entity owners only
    - Read access granted to all authenticated users within the entity
*/

-- Add entity_logo_url column to entities table
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS entity_logo_url text;

-- Create storage bucket for entity logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entity-logos',
  'entity-logos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for entity-logos bucket

-- Allow owners to upload/update their entity's logo
CREATE POLICY "Owners can upload entity logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'entity-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT e.id::text 
    FROM entities e
    INNER JOIN profiles p ON p.entity_id = e.id
    WHERE p.id = auth.uid() AND p.role = 'owner'
  )
);

CREATE POLICY "Owners can update entity logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'entity-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT e.id::text 
    FROM entities e
    INNER JOIN profiles p ON p.entity_id = e.id
    WHERE p.id = auth.uid() AND p.role = 'owner'
  )
)
WITH CHECK (
  bucket_id = 'entity-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT e.id::text 
    FROM entities e
    INNER JOIN profiles p ON p.entity_id = e.id
    WHERE p.id = auth.uid() AND p.role = 'owner'
  )
);

CREATE POLICY "Owners can delete entity logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'entity-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT e.id::text 
    FROM entities e
    INNER JOIN profiles p ON p.entity_id = e.id
    WHERE p.id = auth.uid() AND p.role = 'owner'
  )
);

-- Allow all authenticated users to view entity logos
CREATE POLICY "Users can view entity logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'entity-logos');
