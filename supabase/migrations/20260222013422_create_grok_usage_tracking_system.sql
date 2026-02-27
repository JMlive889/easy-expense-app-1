/*
  # Create Grok API Usage Tracking System

  1. New Tables
    - `grok_api_usage`
      - `id` (uuid, primary key) - Unique identifier for each usage record
      - `user_id` (uuid, foreign key to auth.users) - User who made the API call
      - `entity_id` (uuid, foreign key to entities) - Entity context for the call
      - `message_id` (uuid, nullable) - Reference to chat message if applicable
      - `document_id` (uuid, nullable) - Reference to document if applicable
      - `usage_type` (text) - Type of usage: 'chat' or 'document_analysis'
      - `model_used` (text) - Model identifier (e.g., 'grok-beta', 'grok-vision-beta')
      - `prompt_tokens` (integer) - Number of tokens in the prompt
      - `completion_tokens` (integer) - Number of tokens in the completion
      - `total_tokens` (integer) - Total tokens used (prompt + completion)
      - `created_at` (timestamptz) - When the API call was made

    - `user_token_limits`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key to auth.users) - User the limit applies to
      - `entity_id` (uuid, foreign key to entities) - Entity context
      - `monthly_token_limit` (integer) - Token limit per month for this user
      - `created_at` (timestamptz) - When the limit was set
      - `updated_at` (timestamptz) - Last updated timestamp

  2. Security
    - Enable RLS on both tables
    - Users can view their own usage records
    - Owners and accountants can view all usage for their entity
    - Only authenticated users can insert usage records
    - Owners can manage token limits for users in their entity

  3. Performance
    - Index on `user_id` for user-specific queries
    - Index on `entity_id` for entity-wide queries
    - Index on `created_at` for time-based filtering
    - Composite index on `(user_id, created_at)` for efficient monthly reports
    - Composite index on `(entity_id, created_at)` for entity reports

  4. Constraints
    - Check constraint on `usage_type` to enforce valid values
    - Check constraint on token counts to ensure they are non-negative
    - Unique constraint on `(user_id, entity_id)` in user_token_limits
*/

-- Create grok_api_usage table
CREATE TABLE IF NOT EXISTS grok_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  usage_type text NOT NULL CHECK (usage_type IN ('chat', 'document_analysis')),
  model_used text NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens integer NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  total_tokens integer NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_token_limits table
CREATE TABLE IF NOT EXISTS user_token_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  monthly_token_limit integer NOT NULL DEFAULT 1000000 CHECK (monthly_token_limit >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_id)
);

-- Create indexes for grok_api_usage
CREATE INDEX IF NOT EXISTS idx_grok_api_usage_user_id ON grok_api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_grok_api_usage_entity_id ON grok_api_usage(entity_id);
CREATE INDEX IF NOT EXISTS idx_grok_api_usage_created_at ON grok_api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_grok_api_usage_user_created ON grok_api_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_grok_api_usage_entity_created ON grok_api_usage(entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_grok_api_usage_usage_type ON grok_api_usage(usage_type);

-- Create indexes for user_token_limits
CREATE INDEX IF NOT EXISTS idx_user_token_limits_user_id ON user_token_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_token_limits_entity_id ON user_token_limits(entity_id);

-- Enable RLS
ALTER TABLE grok_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grok_api_usage

-- Users can view their own usage records
CREATE POLICY "Users can view own usage records"
  ON grok_api_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owners and accountants can view all usage in their entity
CREATE POLICY "Owners and accountants can view entity usage"
  ON grok_api_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entity_memberships em
      WHERE em.entity_id = grok_api_usage.entity_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'accountant')
    )
  );

-- Authenticated users can insert their own usage records
CREATE POLICY "Users can insert own usage records"
  ON grok_api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_token_limits

-- Users can view their own token limits
CREATE POLICY "Users can view own token limits"
  ON user_token_limits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owners and accountants can view all limits in their entity
CREATE POLICY "Owners and accountants can view entity limits"
  ON user_token_limits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entity_memberships em
      WHERE em.entity_id = user_token_limits.entity_id
        AND em.user_id = auth.uid()
        AND em.role IN ('owner', 'accountant')
    )
  );

-- Owners can manage token limits for users in their entity
CREATE POLICY "Owners can manage entity token limits"
  ON user_token_limits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entity_memberships em
      WHERE em.entity_id = user_token_limits.entity_id
        AND em.user_id = auth.uid()
        AND em.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entity_memberships em
      WHERE em.entity_id = user_token_limits.entity_id
        AND em.user_id = auth.uid()
        AND em.role = 'owner'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_token_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_token_limits_updated_at_trigger ON user_token_limits;
CREATE TRIGGER update_user_token_limits_updated_at_trigger
  BEFORE UPDATE ON user_token_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_token_limits_updated_at();