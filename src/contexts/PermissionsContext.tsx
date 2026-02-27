import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserPermissions, LicensePermissions } from '../lib/permissions';
import { supabase } from '../lib/supabase';

interface PermissionsContextType {
  permissions: LicensePermissions | null;
  loading: boolean;
  refetch: () => Promise<void>;
  hasPermission: (permission: keyof LicensePermissions) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [permissions, setPermissions] = useState<LicensePermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!user?.id) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    if (profile?.role === 'owner') {
      setPermissions({
        can_manage_categories: true,
        can_view_reports: true,
        can_enter_multiple_items: true
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const userPermissions = await fetchUserPermissions(user.id);
    setPermissions(userPermissions);
    setLoading(false);
  };

  useEffect(() => {
    fetchPermissions();

    const channel = supabase
      .channel('permission_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'license_permissions'
        },
        () => {
          fetchPermissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.role]);

  const hasPermission = (permission: keyof LicensePermissions): boolean => {
    if (profile?.role === 'owner') return true;
    if (!permissions) return false;
    return permissions[permission] === true;
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        refetch: fetchPermissions,
        hasPermission
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
