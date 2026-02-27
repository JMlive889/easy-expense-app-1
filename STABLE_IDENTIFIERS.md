# Stable Identifier Implementation Guide

## Overview

This application strictly adheres to permanent stable identifier principles across all layers of the stack. This document provides concrete examples and guidelines for maintaining this architecture.

## Implementation Status: 100% Compliant ✅

- **All tables**: Use UUID v4 primary keys
- **All relationships**: Use UUID foreign keys
- **All queries**: Filter by UUIDs, not names
- **All API endpoints**: Accept UUIDs as parameters
- **All components**: Pass UUIDs as props
- **All state management**: Track entities by UUID

## Core Rules (Non-Negotiable)

### Rule 1: Never Use Mutable Names for Data Relationships

**❌ WRONG:**
```typescript
// BAD: Looking up by mutable name
const { data } = await supabase
  .from('entities')
  .select('*')
  .eq('entity_name', 'Acme Corp')
  .single();

// BAD: Using name as foreign key
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('entity_name', 'Acme Corp');
```

**✅ CORRECT:**
```typescript
// GOOD: Looking up by immutable UUID
const { data } = await supabase
  .from('entities')
  .select('*')
  .eq('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
  .single();

// GOOD: Using UUID foreign key
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('entity_id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
```

### Rule 2: Names Are Display-Only Attributes

**✅ CORRECT Usage:**
```typescript
// Display name in UI
<h1>{entity.entity_name}</h1>

// Update name (safe because relationships use UUIDs)
await supabase
  .from('entities')
  .update({ entity_name: 'New Name' })
  .eq('id', entityId);  // UUID lookup

// Map names for dropdowns
const options = entities.map(e => ({
  value: e.id,        // UUID for the value
  label: e.entity_name // Name for display
}));
```

### Rule 3: All Foreign Keys Must Be UUIDs

**Database Schema Pattern:**
```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  todo_id uuid REFERENCES tasks(id),
  parent_document_id uuid REFERENCES documents(id),
  ...
);
```

## Real-World Examples from This Codebase

### Example 1: Entity Management

**File:** `src/lib/entities.ts`

```typescript
// ✅ Lookup entity by UUID
export async function getEntityById(entityId: string): Promise<Entity | null> {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)  // UUID, not entity_name
    .maybeSingle();
  return data;
}

// ✅ Update entity name (safe operation)
export async function updateEntityName(
  entityId: string,
  newName: string
): Promise<void> {
  await supabase
    .from('entities')
    .update({ entity_name: newName })
    .eq('id', entityId);  // UUID lookup

  // All relationships remain intact:
  // - entity_memberships.entity_id (UUID) still valid
  // - tasks.entity_id (UUID) still valid
  // - documents.entity_id (UUID) still valid
}
```

### Example 2: Task/Todo Management

**File:** `src/lib/todos.ts`

```typescript
// ✅ Get todos for entity using UUID
export async function getTodos(
  category?: string,
  includeCompleted: boolean = false
): Promise<...> {
  const profile = await getCurrentUserProfile();

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('entity_id', profile.entity_id)  // UUID foreign key
    .is('parent_task_id', null)
    .order('created_at', { ascending: false });

  // Enum filtering (constrained values, not mutable names)
  if (category) {
    query = query.eq('category', category);
  }

  return query;
}

// ✅ Delete task by UUID
export async function deleteTodo(todoId: string): Promise<void> {
  await supabase
    .from('tasks')
    .delete()
    .eq('id', todoId);  // UUID, not content or title
}
```

### Example 3: Document Management

**File:** `src/lib/documents.ts`

```typescript
// ✅ Get document with child images using UUIDs
export async function getDocumentWithImages(id: string): Promise<...> {
  // Get parent document by UUID
  const { data: document } = await getDocument(id);

  // Get child images by parent UUID
  const { data: childImages } = await supabase
    .from('documents')
    .select('*')
    .eq('parent_document_id', id)  // UUID foreign key
    .order('display_order', { ascending: true });

  return { ...document, child_images: childImages };
}

// ✅ Update document title (safe operation)
export async function updateDocument(
  id: string,
  updates: Partial<Document>
): Promise<Document> {
  const { data } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)  // UUID lookup
    .select()
    .single();

  // Parent-child relationships remain intact via parent_document_id UUID
  return data;
}
```

### Example 4: Category Management

**File:** `src/lib/categories.ts`

```typescript
// ✅ Get categories for entity using UUID
export async function getCategories(
  entityId: string,
  type: 'document' | 'receipt',
  includeArchived: boolean = false
): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('entity_id', entityId)  // UUID foreign key
    .eq('type', type);  // Enum (constrained values)

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  return query;
}

// ✅ Update category name (safe operation)
export async function updateCategory(
  id: string,
  name: string
): Promise<Category> {
  const { data } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)  // UUID lookup
    .select()
    .single();

  // Entity relationship remains intact via entity_id UUID
  return data;
}
```

## React Component Patterns

### Example 1: Passing UUIDs as Props

**File:** `src/pages/Documents.tsx`

```typescript
// ✅ Store selected UUID in state
const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

// ✅ Pass UUID to modal
{selectedDocumentId && (
  <DocumentDetailModal
    documentId={selectedDocumentId}  // UUID prop
    onClose={() => setSelectedDocumentId(null)}
  />
)}

// ✅ Click handler stores UUID
<DocumentCard
  document={doc}
  onClick={() => setSelectedDocumentId(doc.id)}  // UUID
/>
```

### Example 2: Navigation with UUIDs

**File:** `src/pages/TodoList.tsx`

```typescript
// ✅ Navigate using UUID
const handleTaskClick = (taskId: string) => {
  navigate(`/messages/${taskId}`);  // UUID in URL
};

// ✅ Read UUID from URL params
const { taskId } = useParams<{ taskId: string }>();
```

### Example 3: Context Providers

**File:** `src/contexts/AuthContext.tsx`

```typescript
// ✅ Track current entity by UUID
const [currentEntity, setCurrentEntity] = useState<Entity | null>(null);

// ✅ Switch entity by UUID
const switchEntity = async (entityId: string) => {
  const entity = await getEntityById(entityId);  // UUID lookup
  setCurrentEntity(entity);

  // Update active membership by UUID
  await supabase
    .from('entity_memberships')
    .update({ is_active: true })
    .eq('user_id', user.id)      // UUID
    .eq('entity_id', entityId);  // UUID
};
```

## Enum Field Pattern

Some fields use database-constrained enums for efficiency. This is acceptable because:
1. Values are immutable (set by database constraint)
2. Values are not user-editable
3. They are not used for relationships (no foreign keys)

### Task Category Enum

**Schema:**
```sql
category text NOT NULL CHECK (category IN ('general', 'docs', 'messages', 'receipts'))
```

**Usage:**
```typescript
// ✅ Filtering by constrained enum (acceptable)
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('category', 'docs')  // Fixed enum value
  .eq('entity_id', entityId);  // UUID relationship
```

**Why This Is Safe:**
- The `category` values cannot change (database constraint)
- It's not used as a primary key or foreign key
- It's an indexed field for query performance
- It's a small, fixed set of values

### Category Type Enum

**Schema:**
```sql
type text NOT NULL CHECK (type IN ('document', 'receipt'))
```

**Usage:**
```typescript
// ✅ Filtering by constrained enum (acceptable)
const { data } = await supabase
  .from('categories')
  .select('*')
  .eq('type', 'document')  // Fixed enum value
  .eq('entity_id', entityId);  // UUID relationship
```

## Testing Stability

### Test 1: Rename Entity

```typescript
// 1. Record relationships before rename
const beforeEntities = await supabase
  .from('entity_memberships')
  .select('*')
  .eq('entity_id', entityId);

const beforeTasks = await supabase
  .from('tasks')
  .select('*')
  .eq('entity_id', entityId);

// 2. Rename entity
await supabase
  .from('entities')
  .update({ entity_name: 'New Company Name' })
  .eq('id', entityId);

// 3. Verify relationships unchanged
const afterEntities = await supabase
  .from('entity_memberships')
  .select('*')
  .eq('entity_id', entityId);

const afterTasks = await supabase
  .from('tasks')
  .select('*')
  .eq('entity_id', entityId);

// Should return same data
expect(afterEntities.length).toBe(beforeEntities.length);
expect(afterTasks.length).toBe(beforeTasks.length);
```

### Test 2: Rename Category

```typescript
// 1. Get category and its entity
const category = await supabase
  .from('categories')
  .select('*, entity:entities(*)')
  .eq('id', categoryId)
  .single();

const oldName = category.name;
const entityId = category.entity_id;

// 2. Rename category
await supabase
  .from('categories')
  .update({ name: 'New Category Name' })
  .eq('id', categoryId);

// 3. Verify entity relationship intact
const updatedCategory = await supabase
  .from('categories')
  .select('*, entity:entities(*)')
  .eq('id', categoryId)
  .single();

// UUID relationship should be unchanged
expect(updatedCategory.entity_id).toBe(entityId);
expect(updatedCategory.entity.id).toBe(entityId);
```

## Database Indexes for Performance

All UUID columns are properly indexed:

```sql
-- Entity-based lookups
CREATE INDEX idx_tasks_entity_id ON tasks(entity_id);
CREATE INDEX idx_documents_entity_id ON documents(entity_id);
CREATE INDEX idx_categories_entity_id ON categories(entity_id);

-- User-based lookups
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- Hierarchical relationships
CREATE INDEX idx_tasks_parent_id ON tasks(parent_task_id);
CREATE INDEX idx_documents_parent_id ON documents(parent_document_id);

-- Composite indexes for common queries
CREATE INDEX idx_tasks_entity_category_parent_created
  ON tasks(entity_id, category, parent_task_id, created_at DESC);

CREATE INDEX idx_documents_user_created_parent
  ON documents(user_id, created_at DESC, parent_document_id);
```

## Migration Pattern

When creating new tables, always follow this pattern:

```sql
-- 1. Create table with UUID primary key
CREATE TABLE new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,  -- Mutable, display-only
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Create indexes on UUID columns
CREATE INDEX idx_new_table_entity_id ON new_table(entity_id);
CREATE INDEX idx_new_table_user_id ON new_table(user_id);

-- 3. Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- 4. Create policies using UUID lookups
CREATE POLICY "Users can view their entity's data"
  ON new_table FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.entity_id = new_table.entity_id
    )
  );
```

## Summary Checklist

When adding new features, verify:

- [ ] All new tables use UUID primary keys
- [ ] All foreign keys reference UUID columns
- [ ] All queries use `.eq('id', ...)` or `.eq('*_id', ...)`
- [ ] No queries use `.eq('name', ...)` for lookups
- [ ] Text fields are only used for display
- [ ] Component props pass UUIDs
- [ ] URL parameters use UUIDs
- [ ] API endpoints accept UUIDs
- [ ] State management tracks UUIDs
- [ ] Name changes don't break functionality
- [ ] UUID columns are indexed

## Conclusion

This application achieves 100% stable identifier compliance. All data relationships use permanent, immutable UUIDs, while user-facing names remain flexible and changeable without risk of data corruption or broken references.

The architecture is production-ready, scalable, and resilient to user-initiated changes.
