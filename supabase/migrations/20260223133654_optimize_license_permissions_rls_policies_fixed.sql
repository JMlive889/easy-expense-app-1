/*
  # Optimize License Permissions RLS Policies

  1. Performance Improvement
    - Wraps auth.uid() calls with SELECT to prevent re-evaluation per row
    - Consolidates multiple permissive SELECT policies into one
    
  2. Changes
    - Merges "Owners can view permissions" and "Users can view their own" into one
    - Consolidates INSERT/UPDATE into single management policy
    - Uses licenses.owner_id and licenses.user_id appropriately
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Owners can view permissions for their licenses" ON public.license_permissions;
DROP POLICY IF EXISTS "Users can view their own license permissions" ON public.license_permissions;
DROP POLICY IF EXISTS "Owners can insert permissions for their licenses" ON public.license_permissions;
DROP POLICY IF EXISTS "Owners can update permissions for their licenses" ON public.license_permissions;

-- Create consolidated optimized policies
CREATE POLICY "Users can view license permissions"
  ON public.license_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_permissions.license_id
      AND (l.user_id = (SELECT auth.uid()) OR l.owner_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Owners can manage license permissions"
  ON public.license_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_permissions.license_id
      AND l.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_permissions.license_id
      AND l.owner_id = (SELECT auth.uid())
    )
  );
