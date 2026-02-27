import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

export interface License {
  id: string;
  owner_id: string;
  invited_email: string;
  user_id: string | null;
  license_type: 'admin' | 'guest';
  status: 'invited' | 'active' | 'archived';
  invitation_token: string;
  invitation_sent_at: string;
  accepted_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerInfo {
  id: string;
  email: string;
  full_name: string | null;
}

export interface LicenseUsage {
  active_admin_count: number;
  active_guest_count: number;
  archived_admin_count: number;
  archived_guest_count: number;
  invited_admin_count: number;
  invited_guest_count: number;
}

interface LicenseContextType {
  licenses: License[];
  ownerInfo: OwnerInfo | null;
  usage: LicenseUsage;
  loading: boolean;
  error: string | null;
  inviteUser: (email: string, licenseType: 'admin' | 'guest') => Promise<boolean>;
  archiveLicense: (licenseId: string) => Promise<boolean>;
  reactivateLicense: (licenseId: string) => Promise<boolean>;
  deleteLicense: (licenseId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [usage, setUsage] = useState<LicenseUsage>({
    active_admin_count: 0,
    active_guest_count: 0,
    archived_admin_count: 0,
    archived_guest_count: 0,
    invited_admin_count: 0,
    invited_guest_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setLicenses([]);
      setOwnerInfo(null);
      setUsage({
        active_admin_count: 0,
        active_guest_count: 0,
        archived_admin_count: 0,
        archived_guest_count: 0,
        invited_admin_count: 0,
        invited_guest_count: 0
      });
      return;
    }

    fetchLicenses();

    const channel = supabase
      .channel('licenses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'licenses',
          filter: `owner_id=eq.${user.id}`
        },
        () => {
          fetchLicenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function fetchLicenses() {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Wait for profile to be created (with retries for new users)
      let profileData = null;
      let retries = 0;
      const maxRetries = 5;

      while (!profileData && retries < maxRetries) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error(`Profile error: ${profileError.message}`);
        }

        if (data) {
          profileData = data;
          setOwnerInfo({
            id: data.id,
            email: data.email,
            full_name: data.full_name
          });
          break;
        }

        // Wait before retrying (exponential backoff)
        if (retries < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 5000)));
          retries++;
        } else {
          // Profile doesn't exist after retries - this is a new user, skip license loading
          console.log('Profile not found after retries - new user signup in progress');
          setLicenses([]);
          setOwnerInfo(null);
          setUsage({
            active_admin_count: 0,
            active_guest_count: 0,
            archived_admin_count: 0,
            archived_guest_count: 0,
            invited_admin_count: 0,
            invited_guest_count: 0
          });
          return;
        }
      }

      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (licensesError) {
        console.error('Licenses fetch error:', licensesError);
        throw new Error(`Database error: ${licensesError.message}`);
      }

      setLicenses(licensesData || []);

      const activeAdminCount = licensesData?.filter(
        l => l.status === 'active' && l.license_type === 'admin'
      ).length || 0;
      const activeGuestCount = licensesData?.filter(
        l => l.status === 'active' && l.license_type === 'guest'
      ).length || 0;
      const archivedAdminCount = licensesData?.filter(
        l => l.status === 'archived' && l.license_type === 'admin'
      ).length || 0;
      const archivedGuestCount = licensesData?.filter(
        l => l.status === 'archived' && l.license_type === 'guest'
      ).length || 0;
      const invitedAdminCount = licensesData?.filter(
        l => l.status === 'invited' && l.license_type === 'admin'
      ).length || 0;
      const invitedGuestCount = licensesData?.filter(
        l => l.status === 'invited' && l.license_type === 'guest'
      ).length || 0;

      setUsage({
        active_admin_count: activeAdminCount + 1, // +1 to count the owner as using an admin license
        active_guest_count: activeGuestCount,
        archived_admin_count: archivedAdminCount,
        archived_guest_count: archivedGuestCount,
        invited_admin_count: invitedAdminCount,
        invited_guest_count: invitedGuestCount
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch licenses';
      console.error('Fetch licenses error:', err);
      setError(message);
      // Don't show toast for new user signups
      if (!message.includes('Profile not found')) {
        showToast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function inviteUser(email: string, licenseType: 'admin' | 'guest'): Promise<boolean> {
    if (!user?.id) {
      showToast('You must be logged in to invite users', 'error');
      return false;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error('Profile verification failed:', profileError);
        showToast('Unable to verify your account. Please refresh the page.', 'error');
        return false;
      }

      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      if (existingUser) {
        showToast('This email is already registered as a user', 'error');
        return false;
      }

      const { data: existingLicense } = await supabase
        .from('licenses')
        .select('id, status')
        .ilike('invited_email', email)
        .neq('status', 'archived')
        .maybeSingle();

      if (existingLicense) {
        showToast('This email already has a pending invitation', 'error');
        return false;
      }

      const { data: insertData, error: insertError } = await supabase
        .from('licenses')
        .insert({
          owner_id: user.id,
          invited_email: email,
          license_type: licenseType,
          status: 'invited'
        })
        .select();

      if (insertError) {
        console.error('License insert error:', insertError);
        throw new Error(`Failed to create license: ${insertError.message}`);
      }

      console.log('License created successfully:', insertData);

      // Generate invitation link
      const invitationToken = insertData[0].invitation_token;
      const invitationLink = `${window.location.origin}/?page=accept-invitation&token=${invitationToken}`;

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(invitationLink);
        showToast(`Invitation link copied to clipboard! Share it with ${email}`, 'success');
      } catch (clipboardErr) {
        console.error('Failed to copy to clipboard:', clipboardErr);
        showToast(`License invitation created for ${email}. Link: ${invitationLink}`, 'success');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to invite user';
      console.error('Invite user error:', err);
      showToast(message, 'error');
      return false;
    }
  }

  async function archiveLicense(licenseId: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('id', licenseId);

      if (updateError) {
        console.error('Archive license error:', updateError);
        throw updateError;
      }

      showToast('License archived successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive license';
      console.error('Archive error:', err);
      showToast(message, 'error');
      return false;
    }
  }

  async function reactivateLicense(licenseId: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('licenses')
        .update({
          status: 'invited',
          archived_at: null
        })
        .eq('id', licenseId);

      if (updateError) {
        console.error('Reactivate license error:', updateError);
        throw updateError;
      }

      showToast('License reactivated successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reactivate license';
      console.error('Reactivate error:', err);
      showToast(message, 'error');
      return false;
    }
  }

  async function deleteLicense(licenseId: string): Promise<boolean> {
    try {
      const { error: deleteError } = await supabase
        .from('licenses')
        .delete()
        .eq('id', licenseId);

      if (deleteError) {
        console.error('Delete license error:', deleteError);
        throw deleteError;
      }

      showToast('License deleted successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete license';
      console.error('Delete error:', err);
      showToast(message, 'error');
      return false;
    }
  }

  return (
    <LicenseContext.Provider
      value={{
        licenses,
        ownerInfo,
        usage,
        loading,
        error,
        inviteUser,
        archiveLicense,
        reactivateLicense,
        deleteLicense,
        refetch: fetchLicenses
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicenses() {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicenses must be used within a LicenseProvider');
  }
  return context;
}
