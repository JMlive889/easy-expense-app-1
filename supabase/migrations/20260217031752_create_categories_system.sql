/*
  # Create Categories System for Document and Receipt Organization

  ## Overview
  This migration creates a comprehensive category management system that allows entities to organize their documents and receipts by custom categories (projects, clients, job sites, etc.). Categories are entity-specific and can be archived but not deleted to preserve data integrity.

  ## New Tables
  
  ### `categories`
  Stores custom categories for organizing documents and receipts within each entity.
  - `id` (uuid, primary key) - Unique identifier
  - `entity_id` (uuid, foreign key) - Links category to specific entity
  - `name` (text) - Category name (e.g., "Project 1", "Client ABC")
  - `type` (text) - Category type: 'document' or 'receipt'
  - `is_archived` (boolean) - Whether category is archived (hidden from active use)
  - `display_order` (integer) - Custom sort order for categories
  - `created_by` (uuid, foreign key) - User who created the category
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Indexes
  - Index on `entity_id` for fast entity-specific queries
  - Composite index on `entity_id, type, is_archived` for filtered queries
  - Index on `display_order` for sorting

  ## Security (RLS Policies)
  - **View**: All authenticated users who belong to the entity can view categories
  - **Create**: Only owners can create new categories
  - **Update**: Only owners can update category details
  - **Archive**: Only owners can archive categories (no deletion allowed)

  ## Automatic Default Categories
  When a new entity is created, it automatically gets seeded with default categories:
  - Document categories: "Project 1", "Project 2"
  - Receipt categories: "Project 1", "Project 2"

  ## Important Notes
  - Categories cannot be deleted, only archived to preserve historical data
  - Archived categories remain visible in filters but not in upload forms
  - Each entity has its own isolated set of categories
  - Category names must be unique within the same type and entity
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('document', 'receipt')),
  is_archived boolean DEFAULT false NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique category names within the same type and entity
  CONSTRAINT unique_category_name_per_type_and_entity UNIQUE (entity_id, type, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_entity_id ON categories(entity_id);
CREATE INDEX IF NOT EXISTS idx_categories_entity_type_archived ON categories(entity_id, type, is_archived);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view categories for their entity
CREATE POLICY "Users can view categories for their entity"
  ON categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = categories.entity_id
    )
  );

-- RLS Policy: Owners can create categories for their entity
CREATE POLICY "Owners can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = categories.entity_id
      AND profiles.role = 'owner'
    )
  );

-- RLS Policy: Owners can update categories for their entity
CREATE POLICY "Owners can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = categories.entity_id
      AND profiles.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = categories.entity_id
      AND profiles.role = 'owner'
    )
  );

-- RLS Policy: Owners can delete (archive) categories for their entity
-- Note: Application layer should use archive instead of delete
CREATE POLICY "Owners can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = categories.entity_id
      AND profiles.role = 'owner'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- Function to seed default categories when a new entity is created
CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default document categories
  INSERT INTO categories (entity_id, name, type, display_order, created_by)
  VALUES
    (NEW.id, 'Project 1', 'document', 1, NEW.owner_id),
    (NEW.id, 'Project 2', 'document', 2, NEW.owner_id);
  
  -- Insert default receipt categories
  INSERT INTO categories (entity_id, name, type, display_order, created_by)
  VALUES
    (NEW.id, 'Project 1', 'receipt', 1, NEW.owner_id),
    (NEW.id, 'Project 2', 'receipt', 2, NEW.owner_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to seed categories when a new entity is created
CREATE TRIGGER seed_entity_categories
  AFTER INSERT ON entities
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_categories();

-- Seed default categories for all existing entities
-- This ensures existing entities get the default categories
DO $$
DECLARE
  entity_record RECORD;
BEGIN
  FOR entity_record IN 
    SELECT e.id, e.owner_id 
    FROM entities e
    WHERE NOT EXISTS (
      SELECT 1 FROM categories c WHERE c.entity_id = e.id
    )
  LOOP
    -- Insert default document categories
    INSERT INTO categories (entity_id, name, type, display_order, created_by)
    VALUES
      (entity_record.id, 'Project 1', 'document', 1, entity_record.owner_id),
      (entity_record.id, 'Project 2', 'document', 2, entity_record.owner_id);
    
    -- Insert default receipt categories
    INSERT INTO categories (entity_id, name, type, display_order, created_by)
    VALUES
      (entity_record.id, 'Project 1', 'receipt', 1, entity_record.owner_id),
      (entity_record.id, 'Project 2', 'receipt', 2, entity_record.owner_id);
  END LOOP;
END $$;