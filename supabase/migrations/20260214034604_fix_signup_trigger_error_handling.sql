/*
  # Fix User Registration Trigger - Enhanced Error Handling

  ## Overview
  This migration improves the `handle_new_user()` trigger function with better error handling
  and ensures it properly handles all signup scenarios.

  ## Changes
  1. Updates `handle_new_user()` function with:
     - Better error handling using exception blocks
     - Proper null handling for metadata
     - Explicit role assignment with fallback
     - More robust insert logic
  
  2. Ensures trigger is properly attached to auth.users table

  ## Purpose
  Fixes "Database error saving new user" issue by adding comprehensive error handling
  and ensuring the profiles table is always populated correctly on user signup.
*/

-- Drop and recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_role user_role;
BEGIN
  -- Extract full name from metadata, default to empty string if not provided
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Determine role based on email
  IF NEW.email = 'admp3ople@gmail.com' THEN
    user_role := 'super_admin'::user_role;
  ELSE
    user_role := 'user'::user_role;
  END IF;

  -- Insert profile with explicit error handling
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_role
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update it instead
      UPDATE public.profiles
      SET email = NEW.email,
          full_name = user_full_name,
          updated_at = now()
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log error but don't fail the signup
      RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
      -- Re-raise to actually fail and show the error
      RAISE;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
