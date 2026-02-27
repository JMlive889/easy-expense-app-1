/*
  # Optimize Grok API Usage RLS Policies

  1. Performance Improvement
    - Wraps auth.uid() calls with SELECT to prevent re-evaluation per row
    - Consolidates multiple permissive SELECT policies into one
    
  2. Changes
    - Merges "Users can view own usage records" and "Owners and accountants can view entity usage"
    - Optimizes auth function calls for better performance
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own usage records" ON public.grok_api_usage;
DROP POLICY IF EXISTS "Owners and accountants can view entity usage" ON public.grok_api_usage;
DROP POLICY IF EXISTS "Users can insert own usage records" ON public.grok_api_usage;

-- Create consolidated optimized policies
CREATE POLICY "Users can view usage records"
  ON public.grok_api_usage
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

CREATE POLICY "Users can insert own usage records"
  ON public.grok_api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
