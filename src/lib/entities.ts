import { supabase } from './supabase';

export interface Entity {
  id: string;
  entity_id: string;
  entity_name: string;
  owner_id: string;
  entity_logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntityMembership {
  id: string;
  user_id: string;
  entity_id: string;
  role: 'owner' | 'accountant' | 'guest';
  is_active: boolean;
  joined_at: string;
  created_at: string;
  entity?: Entity;
}

export interface PendingInvitation {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_logo_url?: string | null;
  inviter_name: string;
  inviter_email: string;
  license_type: 'owner' | 'accountant' | 'guest';
  invitation_token: string;
  invitation_sent_at: string;
}

export async function getUserEntityMemberships(userId: string): Promise<EntityMembership[]> {
  const { data, error } = await supabase
    .from('entity_memberships')
    .select(`
      *,
      entity:entities(*)
    `)
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Error fetching entity memberships:', error);
    throw error;
  }

  return data || [];
}

export async function getActiveEntityMembership(userId: string): Promise<EntityMembership | null> {
  const { data, error } = await supabase
    .from('entity_memberships')
    .select(`
      *,
      entity:entities(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active entity:', error);
    throw error;
  }

  return data;
}

export async function switchActiveEntity(userId: string, entityId: string): Promise<void> {
  const { error } = await supabase
    .from('entity_memberships')
    .update({ is_active: true })
    .eq('user_id', userId)
    .eq('entity_id', entityId);

  if (error) {
    console.error('Error switching entity:', error);
    throw error;
  }
}

export async function getPendingInvitations(userEmail: string): Promise<PendingInvitation[]> {
  const { data, error } = await supabase
    .from('licenses')
    .select(`
      id,
      entity_id,
      license_type,
      invitation_token,
      invitation_sent_at,
      entities!inner(
        entity_id,
        entity_name,
        entity_logo_url,
        owner_id
      ),
      owner:profiles!licenses_owner_id_fkey(
        full_name,
        email
      )
    `)
    .eq('invited_email', userEmail)
    .eq('status', 'invited')
    .order('invitation_sent_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending invitations:', error);
    throw error;
  }

  if (!data) return [];

  return data.map((invite: any) => ({
    id: invite.id,
    entity_id: invite.entities.entity_id,
    entity_name: invite.entities.entity_name,
    entity_logo_url: invite.entities.entity_logo_url,
    inviter_name: invite.owner.full_name || 'Unknown',
    inviter_email: invite.owner.email,
    license_type: invite.license_type,
    invitation_token: invite.invitation_token,
    invitation_sent_at: invite.invitation_sent_at,
  }));
}

export async function acceptInvitation(
  licenseId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('licenses')
    .update({
      user_id: userId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', licenseId);

  if (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

export async function rejectInvitation(licenseId: string): Promise<void> {
  const { error } = await supabase
    .from('licenses')
    .update({
      status: 'rejected',
      archived_at: new Date().toISOString(),
    })
    .eq('id', licenseId);

  if (error) {
    console.error('Error rejecting invitation:', error);
    throw error;
  }
}

export async function createNewEntity(
  userId: string,
  entityName: string
): Promise<Entity> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('owner_id')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('Failed to fetch user profile');
  }

  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .insert({
      entity_id: `TY${Date.now().toString().slice(-6)}`,
      entity_name: entityName,
      owner_id: userId,
    })
    .select()
    .single();

  if (entityError || !entity) {
    console.error('Error creating entity:', entityError);
    throw entityError || new Error('Failed to create entity');
  }

  const { error: membershipError } = await supabase
    .from('entity_memberships')
    .insert({
      user_id: userId,
      entity_id: entity.id,
      role: 'owner',
      is_active: false,
    });

  if (membershipError) {
    console.error('Error creating membership:', membershipError);
    throw membershipError;
  }

  return entity;
}

export async function getEntityById(entityId: string): Promise<Entity | null> {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching entity:', error);
    throw error;
  }

  return data;
}
