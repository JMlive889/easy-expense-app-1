/*
  # Fix Function Security with Immutable Search Path

  1. Security Improvement
    - Sets immutable search_path on all functions to prevent privilege escalation
    - Protects against search_path manipulation attacks
    
  2. Updated Functions
    - update_updated_at_column
    - update_user_token_limits_updated_at
    - get_user_entity_role
    - can_view_all_entity_documents
    
  3. Changes
    - Adds `SET search_path = public` to each function
    - Maintains all existing functionality
    - No behavioral changes
*/

-- Update trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update trigger function for user_token_limits
CREATE OR REPLACE FUNCTION public.update_user_token_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- RBAC helper function to get user's role in an entity
CREATE OR REPLACE FUNCTION public.get_user_entity_role(
  user_uuid uuid,
  entity_uuid uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM entity_memberships
  WHERE user_id = user_uuid 
    AND entity_id = entity_uuid 
    AND is_active = true
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'guest');
END;
$$;

-- RBAC helper function to check document viewing permissions
CREATE OR REPLACE FUNCTION public.can_view_all_entity_documents(
  user_uuid uuid,
  entity_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  user_role := get_user_entity_role(user_uuid, entity_uuid);
  RETURN user_role IN ('owner', 'accountant');
END;
$$;
