import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEntityRole } from './useEntityRole';
import { usePermissions } from '../contexts/PermissionsContext';
import {
  canViewReports,
  canCreateEntity,
  canManageEntitySettings,
  canInviteUsers,
  canViewAllTasks,
  canViewAllMessages,
  type EntityRole
} from '../lib/rbac';

export function useRBAC() {
  const { user, profile } = useAuth();
  const { role, loading } = useEntityRole();
  const { permissions: licensePermissions, loading: permissionsLoading } = usePermissions();
  const [permissions, setPermissions] = useState({
    canViewReports: false,
    canCreateEntity: false,
    canManageEntitySettings: false,
    canInviteUsers: false,
    canViewAllTasks: false,
    canViewAllMessages: false,
    canViewAllDocuments: false
  });

  useEffect(() => {
    if (!loading && !permissionsLoading && role) {
      setPermissions({
        canViewReports: canViewReports(role, licensePermissions?.can_view_reports),
        canCreateEntity: canCreateEntity(role),
        canManageEntitySettings: canManageEntitySettings(role),
        canInviteUsers: canInviteUsers(role),
        canViewAllTasks: canViewAllTasks(role),
        canViewAllMessages: canViewAllMessages(role),
        canViewAllDocuments: role === 'owner' || role === 'accountant'
      });
    }
  }, [role, loading, licensePermissions, permissionsLoading]);

  return {
    role: role as EntityRole,
    permissions,
    loading: loading || permissionsLoading,
    isOwner: role === 'owner',
    isAccountant: role === 'accountant',
    isGuest: role === 'guest'
  };
}
