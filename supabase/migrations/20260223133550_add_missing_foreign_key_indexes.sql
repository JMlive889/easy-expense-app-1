/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvement
    - Creates indexes for all unindexed foreign keys
    - Improves join performance and foreign key constraint checks
    
  2. New Indexes
    - bookkeeper_inquiries.user_id
    - categories.created_by
    - documents.parent_document_id, todo_id, user_id
    - grok_api_usage.document_id, message_id
    - licenses.entity_id, user_id
    - profiles.entity_id
    - task_notifications.task_id, user_id
    - tasks.created_by
*/

-- bookkeeper_inquiries
CREATE INDEX IF NOT EXISTS idx_bookkeeper_inquiries_user_id 
  ON public.bookkeeper_inquiries(user_id);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_created_by 
  ON public.categories(created_by);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id 
  ON public.documents(parent_document_id);

CREATE INDEX IF NOT EXISTS idx_documents_todo_id 
  ON public.documents(todo_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id 
  ON public.documents(user_id);

-- grok_api_usage
CREATE INDEX IF NOT EXISTS idx_grok_api_usage_document_id 
  ON public.grok_api_usage(document_id);

CREATE INDEX IF NOT EXISTS idx_grok_api_usage_message_id 
  ON public.grok_api_usage(message_id);

-- licenses
CREATE INDEX IF NOT EXISTS idx_licenses_entity_id 
  ON public.licenses(entity_id);

CREATE INDEX IF NOT EXISTS idx_licenses_user_id 
  ON public.licenses(user_id);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_entity_id 
  ON public.profiles(entity_id);

-- task_notifications
CREATE INDEX IF NOT EXISTS idx_task_notifications_task_id 
  ON public.task_notifications(task_id);

CREATE INDEX IF NOT EXISTS idx_task_notifications_user_id 
  ON public.task_notifications(user_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_created_by 
  ON public.tasks(created_by);
