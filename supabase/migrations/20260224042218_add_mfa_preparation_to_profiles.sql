/*
  # Add MFA Preparation Fields to Profiles Table

  1. New Columns
    - `mfa_enabled` (boolean, default false)
      - Tracks whether the user has Multi-Factor Authentication enabled
      - Links to Supabase's built-in `auth.mfa_factors` system
      - NOT NULL with default false for data integrity

    - `mfa_preference` (text, nullable)
      - Stores the user's preferred MFA method ('totp' or 'sms')
      - NULL when MFA is not configured
      - CHECK constraint ensures only valid values

    - `mfa_backup_codes_generated_at` (timestamptz, nullable)
      - Timestamp of when backup codes were last generated
      - Helps determine if codes need to be refreshed
      - NULL when backup codes haven't been generated yet

  2. Indexes
    - Index on `mfa_enabled` for efficient filtering of users with MFA

  3. Important Notes
    - MFA fields ready for future 2FA implementation – do not remove
    - Actual MFA secrets (TOTP keys, etc.) are securely managed by Supabase in `auth.mfa_factors`
    - These fields are for UI state and user preferences only
    - Password reset tokens are handled by Supabase Auth in `auth.users` table
    - No RLS changes needed - existing policies cover these new columns

  4. Safety
    - All new columns are nullable or have defaults to avoid breaking existing rows
    - Uses DO block with IF NOT EXISTS checks for idempotent execution
    - No data migration required
*/

-- Add mfa_enabled column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'mfa_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mfa_enabled boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add mfa_preference column with CHECK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'mfa_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mfa_preference text NULL;
  END IF;
END $$;

-- Add CHECK constraint for mfa_preference values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'profiles'
    AND constraint_name = 'profiles_mfa_preference_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_mfa_preference_check
      CHECK (mfa_preference IS NULL OR mfa_preference IN ('totp', 'sms'));
  END IF;
END $$;

-- Add mfa_backup_codes_generated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'mfa_backup_codes_generated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mfa_backup_codes_generated_at timestamptz NULL;
  END IF;
END $$;

-- Create index on mfa_enabled for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_mfa_enabled ON profiles(mfa_enabled);

-- Add helpful comment on the table
COMMENT ON COLUMN profiles.mfa_enabled IS 'Indicates if user has enabled Multi-Factor Authentication. Syncs with auth.mfa_factors table.';
COMMENT ON COLUMN profiles.mfa_preference IS 'User preferred MFA method: totp (authenticator app) or sms (text message). NULL if not configured.';
COMMENT ON COLUMN profiles.mfa_backup_codes_generated_at IS 'Timestamp when MFA backup codes were last generated. NULL if never generated.';
