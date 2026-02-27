/*
  # Remove Unused Indexes

  1. Performance Improvement
    - Removes indexes that are not being used according to Supabase analysis
    - Reduces index maintenance overhead
    - Improves write performance
    
  2. Removed Indexes
    - grok_api_usage: user_id, entity_id, created_at, user_created, usage_type
    - user_token_limits: user_id, entity_id
    - entity_memberships: user_entity_active, entity_role
    - tasks: assigned_users
    - profiles: current_entity, active_entity_id, current_entity_id
    - documents: category, type_category
    - saved_reports: user_id
    - license_notes: author_id
    
  Note: These can be recreated later if query patterns change
*/

DROP INDEX IF EXISTS public.idx_grok_api_usage_user_id;
DROP INDEX IF EXISTS public.idx_grok_api_usage_entity_id;
DROP INDEX IF EXISTS public.idx_grok_api_usage_created_at;
DROP INDEX IF EXISTS public.idx_grok_api_usage_user_created;
DROP INDEX IF EXISTS public.idx_grok_api_usage_usage_type;
DROP INDEX IF EXISTS public.idx_user_token_limits_user_id;
DROP INDEX IF EXISTS public.idx_user_token_limits_entity_id;
DROP INDEX IF EXISTS public.idx_entity_memberships_user_entity_active;
DROP INDEX IF EXISTS public.idx_entity_memberships_entity_role;
DROP INDEX IF EXISTS public.idx_tasks_assigned_users;
DROP INDEX IF EXISTS public.idx_profiles_current_entity;
DROP INDEX IF EXISTS public.idx_documents_category;
DROP INDEX IF EXISTS public.idx_documents_type_category;
DROP INDEX IF EXISTS public.idx_saved_reports_user_id;
DROP INDEX IF EXISTS public.idx_profiles_active_entity_id;
DROP INDEX IF EXISTS public.idx_profiles_current_entity_id;
DROP INDEX IF EXISTS public.idx_license_notes_author_id;
