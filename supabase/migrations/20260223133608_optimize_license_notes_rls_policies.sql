/*
  # Optimize License Notes RLS Policies

  1. Performance Improvement
    - Wraps auth.uid() calls with SELECT to prevent re-evaluation per row
    - Significantly improves query performance at scale
    
  2. Security
    - Maintains same access control logic
    - Admins can view/create notes for their entity licenses
    - Authors can update/delete their own notes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view notes for their entity licenses" ON public.license_notes;
DROP POLICY IF EXISTS "Admins can create notes for their entity licenses" ON public.license_notes;
DROP POLICY IF EXISTS "Authors can update their own notes" ON public.license_notes;
DROP POLICY IF EXISTS "Authors can delete their own notes" ON public.license_notes;

-- Recreate with optimized auth checks
CREATE POLICY "Admins can view notes for their entity licenses"
  ON public.license_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_notes.license_id
      AND l.entity_id IN (
        SELECT entity_id FROM public.entity_memberships
        WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin', 'accountant')
        AND is_active = true
      )
    )
  );

CREATE POLICY "Admins can create notes for their entity licenses"
  ON public.license_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_notes.license_id
      AND l.entity_id IN (
        SELECT entity_id FROM public.entity_memberships
        WHERE user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin', 'accountant')
        AND is_active = true
      )
    )
  );

CREATE POLICY "Authors can update their own notes"
  ON public.license_notes
  FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));

CREATE POLICY "Authors can delete their own notes"
  ON public.license_notes
  FOR DELETE
  TO authenticated
  USING (author_id = (SELECT auth.uid()));
