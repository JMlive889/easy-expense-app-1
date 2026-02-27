/*
  # Optimize Saved Reports RLS Policies

  1. Performance Improvement
    - Wraps auth.uid() calls with SELECT to prevent re-evaluation per row
    - Significantly improves query performance at scale
    
  2. Security
    - Maintains same access control logic
    - Users can view reports for their entity
    - Users can only manage their own reports (using user_id column)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view saved reports for their entity" ON public.saved_reports;
DROP POLICY IF EXISTS "Users can create saved reports for their entity" ON public.saved_reports;
DROP POLICY IF EXISTS "Users can update their own saved reports" ON public.saved_reports;
DROP POLICY IF EXISTS "Users can delete their own saved reports" ON public.saved_reports;

-- Recreate with optimized auth checks
CREATE POLICY "Users can view saved reports for their entity"
  ON public.saved_reports
  FOR SELECT
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id FROM public.entity_memberships
      WHERE user_id = (SELECT auth.uid())
      AND is_active = true
    )
  );

CREATE POLICY "Users can create saved reports for their entity"
  ON public.saved_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND entity_id IN (
      SELECT entity_id FROM public.entity_memberships
      WHERE user_id = (SELECT auth.uid())
      AND is_active = true
    )
  );

CREATE POLICY "Users can update their own saved reports"
  ON public.saved_reports
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own saved reports"
  ON public.saved_reports
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
