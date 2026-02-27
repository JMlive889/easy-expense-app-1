import { useState, useEffect } from 'react';
import { Building2, Plus, Check, X, UserPlus, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useRBAC } from '../hooks/useRBAC';
import {
  getUserEntityMemberships,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  EntityMembership,
  PendingInvitation,
} from '../lib/entities';
import { getEntityLogoUrl } from '../lib/entityLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageType } from '../App';
import { AppHeader } from '../components/AppHeader';

interface EntitiesProps {
  onNavigate: (page: PageType) => void;
}

function getLicenseRoleLabel(licenseType: string): string {
  switch (licenseType) {
    case 'admin':
      return 'Accountant';
    case 'guest':
      return 'User';
    default:
      return licenseType.charAt(0).toUpperCase() + licenseType.slice(1);
  }
}

function getLicenseRoleDescription(licenseType: string): string {
  switch (licenseType) {
    case 'admin':
      return 'You will be able to view reports, manage tasks, and more.';
    case 'guest':
      return 'You have access to upload receipts and documents, and create todos between members of your team.';
    default:
      return '';
  }
}

export default function Entities({ onNavigate }: EntitiesProps) {
  const { user, profile, entity, switchEntity, createNewEntity } = useAuth();
  const { showToast } = useToast();
  const { isOwner } = useRBAC();
  const [memberships, setMemberships] = useState<EntityMembership[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingEntityId, setSwitchingEntityId] = useState<string | null>(null);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, profile]);

  const loadData = async () => {
    if (!user || !profile?.email) {
      setLoading(false);
      return;
    }

    try {
      const [membershipsData, invitationsData] = await Promise.all([
        getUserEntityMemberships(user.id),
        getPendingInvitations(profile.email),
      ]);

      setMemberships(membershipsData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading entities data:', error);
      showToast('Failed to load entities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchEntity = async (entityId: string) => {
    const isActive = entity?.id === entityId;

    if (isActive) {
      showToast('Entity Loaded', 'success');
      return;
    }

    setSwitchingEntityId(entityId);
    try {
      const { error } = await switchEntity(entityId);
      if (error) throw error;

      showToast('Switched entity successfully', 'success');
      await loadData();
      onNavigate('dashboard');
    } catch (error) {
      console.error('Error switching entity:', error);
      showToast('Failed to switch entity', 'error');
    } finally {
      setSwitchingEntityId(null);
    }
  };

  const handleAcceptInvitation = async (invitation: PendingInvitation) => {
    if (!user) return;

    setProcessingInviteId(invitation.id);
    try {
      await acceptInvitation(invitation.id, user.id);

      const updatedMemberships = await getUserEntityMemberships(user.id);
      const newMembership = updatedMemberships.find(
        (m) => (m.entity as any)?.entity_id === invitation.entity_id
      );

      if (newMembership) {
        await switchEntity(newMembership.entity_id);
      }

      showToast('Invitation accepted! Welcome to ' + invitation.entity_name, 'success');
      onNavigate('dashboard');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showToast('Failed to accept invitation', 'error');
      setProcessingInviteId(null);
    }
  };

  const handleRejectInvitation = async (inviteId: string) => {
    setProcessingInviteId(inviteId);
    try {
      await rejectInvitation(inviteId);
      showToast('Invitation rejected', 'success');
      await loadData();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      showToast('Failed to reject invitation', 'error');
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleCreateEntity = async () => {
    if (!newEntityName.trim()) {
      showToast('Please enter an entity name', 'error');
      return;
    }

    setCreating(true);
    try {
      const { error } = await createNewEntity(newEntityName.trim());
      if (error) throw error;

      showToast('Entity created successfully', 'success');
      setShowCreateModal(false);
      setNewEntityName('');
      await loadData();
      onNavigate('dashboard');
    } catch (error) {
      console.error('Error creating entity:', error);
      showToast('Failed to create entity', 'error');
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'accountant':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'guest':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const hasNoMemberships = memberships.length === 0;
  const isNewUserWithInvites = hasNoMemberships && invitations.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <AppHeader
          pageTitle="Your Entities"
          currentPage="entities"
          onNavigate={onNavigate}
          headerVisible={profile?.header_visible ?? true}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <AppHeader
        pageTitle="Your Entities"
        currentPage="entities"
        onNavigate={onNavigate}
        headerVisible={profile?.header_visible ?? true}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-8 lg:pb-8 flex-1 w-full overflow-y-auto">
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-400">
            Manage your business entities and switch between accounts
          </p>
        </div>

        {isNewUserWithInvites && (
          <div className="mb-8 rounded-2xl border-2 border-[#2D9F84] bg-[#2D9F84]/8 dark:bg-[#2D9F84]/15 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#2D9F84]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-5 h-5 text-[#2D9F84]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  You have been invited to join {invitations.length === 1 ? 'an entity' : `${invitations.length} entities`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {invitations.length === 1
                    ? `${invitations[0].inviter_name} has invited you to join ${invitations[0].entity_name} as ${getLicenseRoleLabel(invitations[0].license_type)}. Accept below to get started — no separate billing needed.`
                    : 'You have pending invitations below. Accept one to get started — no separate billing needed.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {entity && (
          <Card className="mb-8 bg-[#2D9F84]/10 dark:bg-[#2D9F84]/20 border-[#2D9F84]/30 dark:border-[#2D9F84]/40 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                {entity.entity_logo_url ? (
                  <img
                    src={getEntityLogoUrl(entity.entity_logo_url)}
                    alt={entity.entity_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {entity.entity_name}
                  </h2>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Current
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Entity ID: {entity.entity_id}
                </p>
              </div>
            </div>
          </Card>
        )}

        {invitations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pending Invitations
              </h2>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {invitations.length}
              </span>
            </div>
            <div className="space-y-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
              {invitations.map((invitation) => {
                const roleLabel = getLicenseRoleLabel(invitation.license_type);
                const roleDescription = getLicenseRoleDescription(invitation.license_type);
                const isProcessing = processingInviteId === invitation.id;

                return (
                  <Card key={invitation.id} className="overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {invitation.entity_logo_url ? (
                          <img
                            src={invitation.entity_logo_url}
                            alt={invitation.entity_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {invitation.entity_name}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            invitation.license_type === 'admin'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {roleLabel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Invited by {invitation.inviter_name}
                        </p>
                        {roleDescription && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {roleDescription}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 mt-0.5">
                        <Button
                          onClick={() => handleAcceptInvitation(invitation)}
                          disabled={isProcessing}
                          variant="primary"
                          size="sm"
                        >
                          <Check className="w-4 h-4" />
                          {isProcessing ? 'Joining...' : 'Accept'}
                        </Button>
                        <Button
                          onClick={() => handleRejectInvitation(invitation.id)}
                          disabled={isProcessing}
                          variant="secondary"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                All Entities
              </h2>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-2xl text-base font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New
              </button>
            )}
          </div>
          <div className="space-y-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 min-h-[200px] flex flex-col">
            {memberships.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 gap-3">
                {invitations.length > 0 ? (
                  <>
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                      Accept an invitation above to join an entity, or create your own.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">
                        No entities yet
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs max-w-xs">
                        If you were invited by someone, your invitation will appear above automatically. Otherwise, create a new entity to get started.
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              memberships.map((membership) => {
                const memberEntity = membership.entity as any;
                const isActive = entity?.id === membership.entity_id;
                const isSwitching = switchingEntityId === membership.entity_id;

                return (
                  <Card
                    key={membership.id}
                    className={`${
                      isActive ? 'border-[#2D9F84] dark:border-[#2D9F84]' : ''
                    } ${
                      !isActive && !isSwitching
                        ? 'cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all'
                        : ''
                    } p-4`}
                    onClick={() => handleSwitchEntity(membership.entity_id)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isSwitching ? 'Switching...' : memberEntity?.entity_name}
                      </p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(membership.role)}`}>
                        {membership.role.charAt(0).toUpperCase() + membership.role.slice(1)}
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowCreateModal(false);
            setNewEntityName('');
          }}
        >
          <Card
            className="max-w-md w-full !bg-white dark:!bg-gray-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create New Entity
              </h2>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Important Notice:</p>
                  <ul className="list-none ml-0 pl-0 space-y-1">
                    <li>Each entity requires a separate subscription</li>
                    <li>Billing is managed independently per entity</li>
                    <li>Subscriptions must be cancelled separately</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entity Name
              </label>
              <input
                type="text"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="Enter entity name"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {newEntityName.length}/100 characters
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreateEntity}
                disabled={creating || !newEntityName.trim()}
                variant="primary"
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create Entity'}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewEntityName('');
                }}
                disabled={creating}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
