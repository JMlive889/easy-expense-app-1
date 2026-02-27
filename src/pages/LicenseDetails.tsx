import { Mail, User, Archive, RotateCcw, Trash2, CheckCircle, Clock, Crown, Copy, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { License, OwnerInfo } from '../hooks/useLicenses';
import { useLicenseNotes } from '../hooks/useLicenseNotes';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { NoteCard } from '../components/licenses/NoteCard';
import { AddNoteForm } from '../components/licenses/AddNoteForm';
import { Skeleton } from '../components/ui/Skeleton';
import { UsageSection } from '../components/licenses/UsageSection';
import { fetchLicensePermissions, updateLicensePermissions, LicensePermissions } from '../lib/permissions';
import { AppHeader } from '../components/AppHeader';

interface LicenseDetailsProps {
  license: License | OwnerInfo | null;
  isOwnerLicense?: boolean;
  onBack: () => void;
  onArchive?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopyInvite?: (invitationToken: string) => void;
}

export function LicenseDetails({
  license,
  isOwnerLicense = false,
  onBack,
  onArchive,
  onReactivate,
  onDelete,
  onCopyInvite
}: LicenseDetailsProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const licenseData = license as License;
  const ownerData = license as OwnerInfo;

  const licenseId = isOwnerLicense ? null : licenseData?.id || null;
  const { notes, loading: notesLoading, addNote, updateNote, deleteNote } = useLicenseNotes(licenseId);

  const [permissions, setPermissions] = useState<LicensePermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwnerLicense && licenseData?.id && (licenseData.status === 'active' || licenseData.status === 'invited')) {
      loadPermissions();
    }
  }, [isOwnerLicense, licenseData?.id, licenseData?.status]);

  const loadPermissions = async () => {
    if (!licenseData?.id) return;

    setLoadingPermissions(true);
    const perms = await fetchLicensePermissions(licenseData.id);
    setPermissions(perms);
    setLoadingPermissions(false);
  };

  const handlePermissionToggle = async (permission: keyof LicensePermissions) => {
    if (!licenseData?.id || !permissions) return;

    setUpdatingPermission(permission);
    const newValue = !permissions[permission];

    const success = await updateLicensePermissions(licenseData.id, {
      [permission]: newValue
    });

    if (success) {
      setPermissions({ ...permissions, [permission]: newValue });
      showToast(`Permission ${newValue ? 'granted' : 'revoked'} successfully`, 'success');
    } else {
      showToast('Failed to update permission', 'error');
    }

    setUpdatingPermission(null);
  };

  if (!license) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
        <AppHeader
          pageTitle="User Details"
          currentPage="license-details"
          onBack={onBack}
          showBackButton={true}
          headerVisible={profile?.header_visible ?? true}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">License not found</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (isOwnerLicense) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
          <CheckCircle className="w-4 h-4" />
          Active
        </span>
      );
    }

    switch (licenseData.status) {
      case 'invited':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            <Clock className="w-4 h-4" />
            Pending Invitation
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
            <Archive className="w-4 h-4" />
            Archived
          </span>
        );
    }
  };

  const getLicenseTypeBadge = () => {
    if (isOwnerLicense) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          <Crown className="w-4 h-4" />
          Owner
        </span>
      );
    }

    const label = licenseData.license_type === 'admin' ? 'Accountant' : 'Guest';
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
        licenseData.license_type === 'admin'
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
      }`}>
        {label}
      </span>
    );
  };

  const email = isOwnerLicense ? ownerData.email : licenseData.invited_email;
  const fullName = isOwnerLicense ? ownerData.full_name : null;
  const hasUserId = isOwnerLicense ? true : !!licenseData.user_id;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <AppHeader
        pageTitle="User Details"
        currentPage="license-details"
        onBack={onBack}
        showBackButton={true}
        headerVisible={profile?.header_visible ?? true}
      />
      <div className="max-w-4xl mx-auto px-4 py-6 pb-8 lg:pb-8 flex-1 w-full overflow-y-auto space-y-6">
        <div className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {hasUserId ? (
              <User className="w-8 h-8 text-white" />
            ) : (
              <Mail className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
              {email}
            </h1>
            {fullName && (
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-3">
                {fullName}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {getLicenseTypeBadge()}
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {!isOwnerLicense && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                License Information
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Invitation Sent</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {formatDate(licenseData.invitation_sent_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Status</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {licenseData.user_id ? 'Account Created' : 'Account Not Created'}
                  </p>
                </div>
                {licenseData.accepted_at && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Accepted Date</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {formatDate(licenseData.accepted_at)}
                    </p>
                  </div>
                )}
                {licenseData.archived_at && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Archived Date</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {formatDate(licenseData.archived_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                Actions
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                {licenseData.status === 'invited' && onCopyInvite && (
                  <Button
                    onClick={() => onCopyInvite(licenseData.invitation_token)}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Invite Link
                  </Button>
                )}
                {licenseData.status === 'archived' ? (
                  <>
                    {onReactivate && (
                      <Button
                        variant="secondary"
                        onClick={() => onReactivate(licenseData.id)}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reactivate License
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this license?')) {
                            onDelete(licenseData.id);
                          }
                        }}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete License
                      </Button>
                    )}
                  </>
                ) : (
                  onArchive && (
                    <Button
                      variant="secondary"
                      onClick={() => onArchive(licenseData.id)}
                      className="flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive License
                    </Button>
                  )
                )}
              </div>
            </div>

            {(licenseData.status === 'active' || licenseData.status === 'invited') && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  Permissions
                </h2>
                {loadingPermissions ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : permissions ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          Manage Categories
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow user to create, edit, and manage document and receipt categories
                        </p>
                      </div>
                      <button
                        onClick={() => handlePermissionToggle('can_manage_categories')}
                        disabled={updatingPermission === 'can_manage_categories'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                          permissions.can_manage_categories
                            ? 'bg-emerald-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        } ${updatingPermission === 'can_manage_categories' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.can_manage_categories ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          View Reports
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow user to access and view financial reports
                        </p>
                      </div>
                      <button
                        onClick={() => handlePermissionToggle('can_view_reports')}
                        disabled={updatingPermission === 'can_view_reports'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                          permissions.can_view_reports
                            ? 'bg-emerald-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        } ${updatingPermission === 'can_view_reports' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions.can_view_reports ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Failed to load permissions
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {isOwnerLicense && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is the owner account. The owner role cannot be transferred or removed.
            </p>
          </div>
        )}
      </div>

      {(isOwnerLicense || (licenseData.status === 'active' && licenseData.user_id)) && (
        <div className="mb-6">
          <UsageSection userId={isOwnerLicense ? ownerData.user_id : licenseData.user_id!} />
        </div>
      )}

      <div className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Notes
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({notes.length})
          </span>
        </div>

        {notesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <>
            {notes.length > 0 ? (
              <div className="space-y-4 mb-6">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    currentUserId={user?.id || ''}
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-6">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No notes yet. Add a note to track information about this user.
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <AddNoteForm onAdd={addNote} />
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
