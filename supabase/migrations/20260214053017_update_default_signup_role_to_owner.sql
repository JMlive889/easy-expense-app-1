/*
  # Update Default Signup Role to Owner

  ## Overview
  This migration updates the default role for new user signups from 'user' to 'owner'.
  This allows new signups to immediately access subscription and billing features,
  then they can grant access to regular 'users' and 'accountants' as needed.

  ## Changes
  1. Updates `handle_new_user()` function to:
     - Set default role to 'owner' instead of 'user'
     - Keep special case for super_admin email
  
  2. Update existing profiles:
     - Any existing 'user' role profiles will remain as-is
     - Only affects new signups going forward

  ## Security
  - Maintains existing RLS policies
  - Super admin assignment remains restricted to specific email
  - Owner role allows access to subscription/billing sections

  ## Business Logic
  - New signups → Owner (can manage subscriptions, billing, licenses)
  - Owners can grant access to Users and Accountants
  - Users → Limited access, no billing/subscription features
  - Accountants → Access to financial data, no subscription management
*/

-- Update the function to set default role to 'owner'
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
    -- Default to 'owner' for all new signups
    user_role := 'owner'::user_role;
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
