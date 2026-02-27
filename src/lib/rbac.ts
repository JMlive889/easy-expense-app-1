import { supabase } from './supabase';

export type EntityRole = 'owner' | 'accountant' | 'guest';

export interface EntityMembership {
  id: string;
  user_id: string;
  entity_id: string;
  role: EntityRole;
  is_active: boolean;
  joined_at: string;
  created_at: string;
}

export async function getUserEntityRole(
  userId: string,
  entityId: string
): Promise<EntityRole> {
  const { data, error } = await supabase.rpc('get_user_entity_role', {
    user_uuid: userId,
    entity_uuid: entityId
  });

  if (error) {
    console.error('Error getting user entity role:', error);
    return 'guest';
  }

  return (data as EntityRole) || 'guest';
}

export async function canViewAllEntityDocuments(
  userId: string,
  entityId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_view_all_entity_documents', {
    user_uuid: userId,
    entity_uuid: entityId
  });

  if (error) {
    console.error('Error checking document view permissions:', error);
    return false;
  }

  return data === true;
}

export function canViewReports(role: EntityRole, hasPermission?: boolean): boolean {
  if (role === 'owner' || role === 'accountant') {
    return true;
  }
  return hasPermission === true;
}

export function canCreateEntity(role: EntityRole): boolean {
  return role === 'owner';
}

export function canManageEntitySettings(role: EntityRole): boolean {
  return role === 'owner';
}

export function canInviteUsers(role: EntityRole): boolean {
  return role === 'owner' || role === 'accountant';
}

export function canViewAllTasks(role: EntityRole): boolean {
  return role === 'owner' || role === 'accountant';
}

export function canViewAllMessages(role: EntityRole): boolean {
  return role === 'owner' || role === 'accountant';
}

export async function getEntityMembership(
  userId: string,
  entityId: string
): Promise<EntityMembership | null> {
  const { data, error } = await supabase
    .from('entity_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching entity membership:', error);
    return null;
  }

  return data;
}

export async function getAllUserMemberships(
  userId: string
): Promise<EntityMembership[]> {
  const { data, error } = await supabase
    .from('entity_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Error fetching user memberships:', error);
    return [];
  }

  return data || [];
}
