/*
  # Optimize User Token Limits RLS Policies

  1. Performance Improvement
    - Wraps auth.uid() calls with SELECT to prevent re-evaluation per row
    - Consolidates multiple permissive SELECT policies into one
    
  2. Changes
    - Merges all SELECT policies into a single consolidated policy
    - Maintains owner management capabilities
    - Optimizes auth function calls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own token limits" ON public.user_token_limits;
DROP POLICY IF EXISTS "Owners and accountants can view entity limits" ON public.user_token_limits;
DROP POLICY IF EXISTS "Owners can manage entity token limits" ON public.user_token_limits;

-- Create consolidated optimized policies
CREATE POLICY "Users can view token limits"
  ON public.user_token_limits
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR entity_id IN (
      SELECT entity_id FROM public.entity_memberships
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('owner', 'accountant')
      AND is_active = true
    )
  );

CREATE POLICY "Owners can manage token limits"
  ON public.user_token_limits
  FOR ALL
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id FROM public.entity_memberships
      WHERE user_id = (SELECT auth.uid())
      AND role = 'owner'
      AND is_active = true
    )
  )
  WITH CHECK (
    entity_id IN (
      SELECT entity_id FROM public.entity_memberships
      WHERE user_id = (SELECT auth.uid())
      AND role = 'owner'
      AND is_active = true
    )
  );
