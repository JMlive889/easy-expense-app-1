/*
  # Fix Entity Logos Bucket Public Access

  1. Changes
    - Update entity-logos bucket to be public
    - This allows `getPublicUrl()` to work correctly
    - Entity logos are not sensitive data and should be publicly accessible

  2. Security
    - Upload/update/delete still restricted to entity owners via RLS policies
    - Public read access allows images to load without signed URLs
*/

-- Update the entity-logos bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'entity-logos';
