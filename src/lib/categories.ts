import { supabase } from './supabase';

export interface Category {
  id: string;
  entity_id: string;
  name: string;
  type: 'document' | 'receipt';
  is_archived: boolean;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function getCategories(
  entityId: string,
  type: 'document' | 'receipt',
  includeArchived: boolean = false
): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('entity_id', entityId)
    .eq('type', type);

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  query = query.order('display_order', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data || [];
}

export async function createCategory(
  entityId: string,
  name: string,
  type: 'document' | 'receipt',
  userId: string
): Promise<Category> {
  const existingCategories = await getCategories(entityId, type, true);
  const maxOrder = existingCategories.length > 0
    ? Math.max(...existingCategories.map(c => c.display_order))
    : 0;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      entity_id: entityId,
      name: name.trim(),
      type,
      display_order: maxOrder + 1,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A category with this name already exists');
    }
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return data;
}

export async function updateCategory(
  id: string,
  name: string
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A category with this name already exists');
    }
    throw new Error(`Failed to update category: ${error.message}`);
  }

  return data;
}

export async function archiveCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ is_archived: true })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to archive category: ${error.message}`);
  }
}

export async function unarchiveCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ is_archived: false })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to restore category: ${error.message}`);
  }
}

export async function reorderCategories(
  categoryIds: string[]
): Promise<void> {
  const updates = categoryIds.map((id, index) => ({
    id,
    display_order: index + 1,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('categories')
      .update({ display_order: update.display_order })
      .eq('id', update.id);

    if (error) {
      throw new Error(`Failed to reorder categories: ${error.message}`);
    }
  }
}
