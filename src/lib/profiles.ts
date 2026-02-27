import { supabase } from './supabase';

export const updateHeaderVisibility = async (userId: string, headerVisible: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ header_visible: headerVisible })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update header visibility:', error);
    throw error;
  }

  return { error: null };
};

export const updateCurrentEntity = async (userId: string, entityId: string | null) => {
  const { error } = await supabase
    .from('profiles')
    .update({ current_entity_id: entityId })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update current entity:', error);
    throw error;
  }

  return { error: null };
};

export const getCurrentEntity = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('current_entity_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to get current entity:', error);
    throw error;
  }

  return data?.current_entity_id || null;
};
