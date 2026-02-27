import { supabase } from './supabase';

export interface LicensePermissions {
  can_manage_categories: boolean;
  can_view_reports: boolean;
  can_enter_multiple_items: boolean;
}

export async function fetchUserPermissions(userId: string): Promise<LicensePermissions | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_license_permissions', {
      user_id_param: userId,
      entity_id_param: null
    });

    if (error) {
      console.error('Error fetching user permissions:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        can_manage_categories: false,
        can_view_reports: false,
        can_enter_multiple_items: false
      };
    }

    return data[0];
  } catch (err) {
    console.error('Failed to fetch user permissions:', err);
    return null;
  }
}

export async function fetchLicensePermissions(licenseId: string): Promise<LicensePermissions | null> {
  try {
    const { data, error } = await supabase
      .from('license_permissions')
      .select('can_manage_categories, can_view_reports, can_enter_multiple_items')
      .eq('license_id', licenseId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching license permissions:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to fetch license permissions:', err);
    return null;
  }
}

export async function updateLicensePermissions(
  licenseId: string,
  permissions: Partial<LicensePermissions>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('license_permissions')
      .update(permissions)
      .eq('license_id', licenseId);

    if (error) {
      console.error('Error updating license permissions:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to update license permissions:', err);
    return false;
  }
}
