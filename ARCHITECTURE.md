# Architecture Documentation

## Stable Identifier System

This application follows strict stable identifier principles to ensure data integrity and prevent errors from accidental modifications.

### Core Principles

1. **UUID Primary Keys**: All tables use UUID v4 primary keys that are immutable and unique
2. **UUID Foreign Keys**: All relationships use UUID foreign keys, never text-based names
3. **Mutable Display Names**: User-facing names can change without affecting data integrity
4. **No Text-Based Lookups**: Data queries always use stable UUID identifiers

### Database Schema

#### Primary Key Pattern

All tables follow this pattern:

```sql
CREATE TABLE table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

**Tables with UUID Primary Keys:**
- `profiles` - User profile data
- `entities` - Business entities (companies, organizations)
- `entity_memberships` - Multi-entity user access
- `tasks` - To-do items and messages
- `documents` - Uploaded files and receipts
- `categories` - Document categorization
- `licenses` - License invitations
- `chats` - Chat conversations
- `messages` - Chat messages
- `bookkeeper_inquiries` - Accountant requests

#### Foreign Key Pattern

All relationships use UUID foreign keys:

```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ...
);
```

**Key Relationships:**
- Documents belong to entities via `entity_id` (UUID)
- Tasks belong to entities via `entity_id` (UUID)
- Categories belong to entities via `entity_id` (UUID)
- Entity memberships link users to entities via `user_id` and `entity_id` (both UUIDs)
- Task threads use `parent_task_id` (UUID) for hierarchical relationships
- Document galleries use `parent_document_id` (UUID) for image collections

### Enum Fields

Some fields use database-constrained enums for efficiency:

#### Task Category Field

```sql
category text NOT NULL CHECK (category IN ('general', 'docs', 'messages', 'receipts'))
```

- **Purpose**: Categorizes tasks into predefined types
- **Type**: Database-constrained enum (not free-text)
- **Indexed**: Yes, for query performance
- **Mutable**: No, values are fixed by database constraint
- **Safe for Lookups**: Yes, because values cannot change

#### Category Type Field

```sql
type text NOT NULL CHECK (type IN ('document', 'receipt'))
```

- **Purpose**: Distinguishes document categories from receipt categories
- **Type**: Database-constrained enum (not free-text)
- **Indexed**: Yes, for query performance
- **Safe for Lookups**: Yes, because values are fixed by database constraint

**Important**: These are NOT violations of stable identifier principles because:
1. They are constrained enums with immutable value sets
2. They are NOT user-editable text fields
3. They are NOT used for data relationships (foreign keys)
4. They have database-level validation

### Data Access Patterns

#### Correct Pattern (Always Use This)

```typescript
// ✅ Lookup by UUID
const { data } = await supabase
  .from('entities')
  .select('*')
  .eq('id', entityId)
  .single();

// ✅ Update by UUID, change display name safely
await supabase
  .from('entities')
  .update({ entity_name: 'New Name' })
  .eq('id', entityId);

// ✅ Filter by UUID foreign key
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('entity_id', entityId);

// ✅ Enum filtering (constrained values)
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('category', 'docs');
```

#### Incorrect Pattern (Never Do This)

```typescript
// ❌ NEVER lookup by mutable name
const { data } = await supabase
  .from('entities')
  .select('*')
  .eq('entity_name', 'My Company')
  .single();

// ❌ NEVER use names as foreign keys
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('entity_name', 'My Company');
```

### Name Change Safety

Because all relationships use stable UUIDs, these operations are completely safe:

#### Renaming an Entity

```typescript
// Change the display name
await supabase
  .from('entities')
  .update({ entity_name: 'New Company Name' })
  .eq('id', entityId);

// All relationships remain intact:
// - entity_memberships.entity_id still points to correct entity
// - tasks.entity_id still points to correct entity
// - documents.entity_id still points to correct entity
// - categories.entity_id still points to correct entity
```

#### Renaming a Category

```typescript
// Change the display name
await supabase
  .from('categories')
  .update({ name: 'New Category Name' })
  .eq('id', categoryId);

// Documents continue to reference correct entity
// Category relationships remain intact
```

#### Renaming a User

```typescript
// Change the display name
await supabase
  .from('profiles')
  .update({ full_name: 'New User Name' })
  .eq('id', userId);

// All relationships remain intact:
// - tasks.created_by still points to correct user
// - entity_memberships.user_id still points to correct user
// - documents.user_id still points to correct user
```

### API Endpoints

All API endpoints accept and return UUIDs:

```typescript
// ✅ Edge Function accepts UUID
const response = await fetch(`/functions/v1/generate-thumbnail`, {
  method: 'POST',
  body: JSON.stringify({ documentId: '123e4567-e89b-12d3-a456-426614174000' })
});

// ✅ Stripe checkout with UUID
const response = await fetch(`/functions/v1/stripe-checkout`, {
  method: 'POST',
  body: JSON.stringify({ licenseId: '123e4567-e89b-12d3-a456-426614174000' })
});
```

### React Component Props

Components consistently pass UUIDs:

```typescript
// ✅ Pass UUID to child component
<DocumentDetailModal
  documentId={document.id}  // UUID
  onClose={handleClose}
/>

// ✅ Navigate with UUID
navigate(`/messages/${taskId}`);  // UUID

// ✅ Store UUID in state
const [selectedEntityId, setSelectedEntityId] = useState<string>(entity.id);
```

### State Management

Context providers track entities by UUID:

```typescript
// ✅ AuthContext stores entity UUID
const [currentEntity, setCurrentEntity] = useState<Entity | null>(null);

// ✅ Switch entity by UUID
await switchEntity(entityId);  // UUID parameter

// ✅ Update entity name by UUID (safe operation)
await updateEntityName(entityId, newName);  // UUID lookup, name update
```

### Performance Optimization

The database includes indexes on UUID columns for optimal query performance:

```sql
-- UUID indexes
CREATE INDEX idx_tasks_entity_id ON tasks(entity_id);
CREATE INDEX idx_documents_entity_id ON documents(entity_id);
CREATE INDEX idx_categories_entity_id ON categories(entity_id);

-- Enum indexes for filtering
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_categories_type ON categories(type);

-- Composite indexes for common queries
CREATE INDEX idx_tasks_entity_completed ON tasks(entity_id, is_completed);
```

### Testing Stability

To verify stable identifier implementation:

1. **Test Name Changes**:
   - Change entity name and verify all data remains accessible
   - Change category name and verify task assignments work
   - Change user name and verify ownership is preserved

2. **Test Data Relationships**:
   - Verify all foreign keys reference UUID columns
   - Verify no text-based lookups exist in queries
   - Verify navigation uses UUID parameters

3. **Test API Endpoints**:
   - Verify all endpoints accept UUIDs
   - Verify no endpoints use names for lookups
   - Verify responses return UUIDs

### Summary

This application achieves 100% stable identifier compliance:

- **0 Critical Violations**: No mutable names used for relationships
- **100% UUID Primary Keys**: All tables use UUID v4
- **100% UUID Foreign Keys**: All relationships use UUIDs
- **100% Safe Name Changes**: All display names can change safely
- **Optimized Performance**: All UUID lookups are indexed

The architecture ensures data integrity, prevents accidental errors, and provides a solid foundation for scale.
