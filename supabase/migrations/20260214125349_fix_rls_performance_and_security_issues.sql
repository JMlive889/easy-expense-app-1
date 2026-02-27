/*
  # Fix RLS Performance and Security Issues

  ## Overview
  This migration addresses multiple security and performance issues identified in the security audit.

  ## 1. RLS Policy Performance Optimization
  Replaces `auth.uid()` with `(select auth.uid())` in all RLS policies to prevent
  re-evaluation for each row, significantly improving query performance at scale.

  ### Tables Updated:
    - `profiles`: 3 policies optimized
    - `stripe_customers`: 1 policy optimized
    - `stripe_subscriptions`: 1 policy optimized
    - `stripe_orders`: 1 policy optimized

  ## 2. Remove Unused Index
    - Drop `idx_profiles_role` index (not being used by queries)

  ## 3. Fix Function Security
    - Update `handle_new_user` function with stable `search_path`
    - Prevents security issues from mutable search paths

  ## 4. Important Notes
    - All changes are backward compatible
    - No data modifications, only policy and function updates
    - Significant performance improvement expected for large datasets
*/

-- ============================================================================
-- 1. FIX RLS POLICIES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- profiles table policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile data" ON profiles;
CREATE POLICY "Users can update own profile data"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK (
    (select auth.uid()) = id AND (
      role = (SELECT role FROM profiles WHERE id = (select auth.uid())) OR
      (SELECT role FROM profiles WHERE id = (select auth.uid())) IN ('super_admin', 'developer')
    )
  );

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = (select auth.uid())) IN ('super_admin', 'developer')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = (select auth.uid())) IN ('super_admin', 'developer')
  );

-- stripe_customers table policies
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) AND deleted_at IS NULL);

-- stripe_subscriptions table policies
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- stripe_orders table policies
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;
CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 2. REMOVE UNUSED INDEX
-- ============================================================================

DROP INDEX IF EXISTS idx_profiles_role;

-- ============================================================================
-- 3. FIX FUNCTION SECURITY - STABLE SEARCH PATH
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email = 'admp3eople@gmail.com' THEN 'super_admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;