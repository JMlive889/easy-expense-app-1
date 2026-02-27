/*
  # Update push_notifications default value
  
  1. Changes
    - Change `push_notifications` column default from `true` to `false` in `profiles` table
    - This affects only new user signups going forward
  
  2. Notes
    - Existing user data remains unchanged
    - New users will have push notifications disabled by default
    - Email notifications remain enabled by default (true)
    - Users can still enable push notifications manually in settings
*/

ALTER TABLE profiles 
ALTER COLUMN push_notifications SET DEFAULT false;