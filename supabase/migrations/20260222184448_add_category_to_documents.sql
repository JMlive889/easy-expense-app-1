/*
  # Add category column to documents table
  
  ## Overview
  This migration adds a separate 'category' field to distinguish between document type (receipt/document/message) 
  and receipt categorization (Project 1, Project 2, etc.). This fixes the issue where receipts disappear when 
  their category is changed.
  
  ## Changes
  
  1. Schema Changes
    - Add 'category' column to documents table (nullable text field)
    - This will store Receipt Categories for receipts (e.g., "Project 1", "Project 2")
    - The 'type' field remains for document type identification only
  
  2. Data Migration
    - Find all documents where type is NOT 'receipt', 'document', or 'message'
    - These are receipts that were miscategorized
    - Set their type to 'receipt' and move current type value to category field
  
  3. Security
    - No RLS changes needed - existing policies cover the new column
  
  ## Important Notes
  - The 'type' field should only contain: 'receipt', 'document', or 'message'
  - The 'category' field stores user-defined categories for receipts
  - This separation ensures receipts always show on the Receipts page
*/

-- Add category column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Migrate existing data: fix receipts that have custom categories as their type
-- Find documents where type is not one of the three valid types
UPDATE documents 
SET 
  category = type,
  type = 'receipt'
WHERE type NOT IN ('receipt', 'document', 'message')
  AND type IS NOT NULL;

-- Create an index on category for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Create a composite index for common queries (type + category)
CREATE INDEX IF NOT EXISTS idx_documents_type_category ON documents(type, category);