import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useLicenses, License, OwnerInfo } from '../hooks/useLicenses';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getLicenseLimitsByProductName, checkLicenseAvailability } from '../stripe-config';
import { Button } from '../components/ui/Button';
import { LicenseCard } from '../components/licenses/LicenseCard';
import { OwnerLicenseCard } from '../components/licenses/OwnerLicenseCard';
import { InviteLicenseForm } from '../components/licenses/InviteLicenseForm';
import { LicenseStats } from '../components/licenses/LicenseStats';
import { EntityUsageSummary } from '../components/licenses/EntityUsageSummary';
import { AppHeader } from '../components/AppHeader';
import ConfirmModal from '../components/ui/ConfirmModal';

interface LicensesProps {
  onNavigate: (page: string, chatId?: string, licenseData?: { license: License | OwnerInfo; isOwner: boolean }) => void;
}

export function Licenses({ onNavigate }: LicensesProps) {
  const { profile } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { showToast } = useToast();
  const {
    licenses,
    ownerInfo,
    usage,
    loading: licensesLoading,
    inviteUser,
    archiveLicense,
    reactivateLicense,
    deleteLicense
  } = useLicenses();

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [licenseToArchive, setLicenseToArchive] = useState<string | null>(null);
  const [licenseToDelete, setLicenseToDelete] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const productName = subscription?.product_name || 'Basic';
  const limits = getLicenseLimitsByProductName(productName);
  const availability = limits
    ? checkLicenseAvailability(productName, usage.active_admin_count, usage.active_guest_count)
    : null;

  const adminLicenses = licenses.filter(l => l.license_type === 'admin' && l.status !== 'archived');
  const guestLicenses = licenses.filter(l => l.license_type === 'guest' && l.status !== 'archived');

  const handleArchive = async (id: string) => {
    setLicenseToArchive(id);
    setShowArchiveConfirm(true);
  };

  const handleConfirmArchive = async () => {
    if (!licenseToArchive) return;

    try {
      setProcessing(true);
      await archiveLicense(licenseToArchive);
      setShowArchiveConfirm(false);
      setLicenseToArchive(null);
    } catch (err) {
      console.error('Failed to archive license:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelArchive = () => {
    setShowArchiveConfirm(false);
    setLicenseToArchive(null);
  };

  const handleReactivate = async (id: string) => {
    await reactivateLicense(id);
  };

  const handleDelete = async (id: string) => {
    setLicenseToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!licenseToDelete) return;

    try {
      setProcessing(true);
      await deleteLicense(licenseToDelete);
      setShowDeleteConfirm(false);
      setLicenseToDelete(null);
    } catch (err) {
      console.error('Failed to delete license:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setLicenseToDelete(null);
  };

  const handleCopyInvite = async (invitationToken: string) => {
    try {
      const invitationLink = `${window.location.origin}/?page=accept-invitation&token=${invitationToken}`;
      await navigator.clipboard.writeText(invitationLink);
      showToast('Link Copied!', 'success');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      showToast('Failed to copy link', 'error');
    }
  };

  const handleLicenseClick = (license: License) => {
    onNavigate('license-details', undefined, { license, isOwner: false });
  };

  const handleOwnerClick = (owner: OwnerInfo) => {
    onNavigate('license-details', undefined, { license: owner, isOwner: true });
  };

  if (subscriptionLoading || licensesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-blue-600 dark:border-emerald-500"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading licenses...</p>
        </div>
      </div>
    );
  }

  if (!limits || (limits.adminLicenses === 0 && limits.guestLicenses === 0)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <AppHeader
          pageTitle="Licenses"
          currentPage="licenses"
          onNavigate={onNavigate}
          onBack={() => onNavigate('settings')}
          headerVisible={profile?.header_visible ?? true}
        />

        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-lg shadow-sm p-8 text-center border bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No Licenses Available</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                Your current {productName} plan does not include user licenses.
                Upgrade to Premium or Reserve to invite team members.
              </p>
              <Button
                variant="primary"
                onClick={() => onNavigate('pricing')}
              >
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Licenses"
        currentPage="licenses"
        onNavigate={onNavigate}
        onBack={() => onNavigate('settings')}
        headerVisible={profile?.header_visible ?? true}
      />

      <div className="py-12 px-4 sm:px-6 lg:px-8 pb-8 lg:pb-8">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <EntityUsageSummary productName={productName} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <LicenseStats
            title="Admin Licenses"
            totalAvailable={limits.adminLicenses}
            activeCount={usage.active_admin_count}
            invitedCount={usage.invited_admin_count}
            archivedCount={usage.archived_admin_count}
            variant="admin"
          />
          <LicenseStats
            title="Guest Licenses"
            totalAvailable={limits.guestLicenses}
            activeCount={usage.active_guest_count}
            invitedCount={usage.invited_guest_count}
            archivedCount={usage.archived_guest_count}
            variant="guest"
          />
        </div>

          {limits.adminLicenses > 0 && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Owner License</h2>
                {ownerInfo && <OwnerLicenseCard owner={ownerInfo} onClick={handleOwnerClick} />}
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Accountant Licenses</h2>
                <InviteLicenseForm
                  licenseType="admin"
                  availableCount={availability?.adminAvailable || 0}
                  onInvite={inviteUser}
                />
                {adminLicenses.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {adminLicenses.map(license => (
                      <LicenseCard
                        key={license.id}
                        license={license}
                        onArchive={handleArchive}
                        onReactivate={handleReactivate}
                        onDelete={handleDelete}
                        onCopyInvite={handleCopyInvite}
                        onClick={handleLicenseClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-center py-8 rounded-lg border bg-white border-gray-200 dark:bg-black/40 dark:backdrop-blur-sm dark:border-emerald-500/30">
                    <p className="text-gray-500 dark:text-gray-400">
                      No accountant licenses assigned yet
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {limits.guestLicenses > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Guest Licenses</h2>
              <InviteLicenseForm
                licenseType="guest"
                availableCount={availability?.guestAvailable || 0}
                onInvite={inviteUser}
              />
              {guestLicenses.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {guestLicenses.map(license => (
                    <LicenseCard
                      key={license.id}
                      license={license}
                      onArchive={handleArchive}
                      onReactivate={handleReactivate}
                      onDelete={handleDelete}
                      onCopyInvite={handleCopyInvite}
                      onClick={handleLicenseClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-center py-8 rounded-lg border bg-white border-gray-200 dark:bg-black/40 dark:backdrop-blur-sm dark:border-emerald-500/30">
                  <p className="text-gray-500 dark:text-gray-400">
                    No guest licenses assigned yet
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={handleCancelArchive}
        onConfirm={handleConfirmArchive}
        title="Archive License"
        message="Are you sure you want to archive this license? The user will lose access."
        confirmText="Archive"
        cancelText="Cancel"
        variant="danger"
        loading={processing}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete License"
        message="Are you sure you want to permanently delete this license? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={processing}
      />
    </div>
  );
}
