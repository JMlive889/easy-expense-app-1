/*
  # Add Current Entity Selection to Profiles

  1. Changes
    - Add `current_entity_id` column to profiles table
    - Add foreign key constraint to entities table
    - Set default to null (users without entities will have null)
    - Add index for performance
  
  2. Security
    - No RLS changes needed (profiles table already has proper RLS)
    - Users can update their own current_entity_id
  
  3. Notes
    - This allows users to select which entity they're currently working with
    - Categories and other entity-scoped data will filter based on this selection
    - If a user belongs to multiple entities, they can switch between them
*/

-- Add current_entity_id column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_entity_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_current_entity_id ON profiles(current_entity_id);

-- Add helpful comment
COMMENT ON COLUMN profiles.current_entity_id IS 'The entity the user is currently viewing/working with';