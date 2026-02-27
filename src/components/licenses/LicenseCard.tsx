import { Mail, User, Archive, RotateCcw, Trash2, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { License } from '../../hooks/useLicenses';
import { Button } from '../ui/Button';
import { useUserGrokUsage } from '../../hooks/useGrokUsage';
import { useAuth } from '../../contexts/AuthContext';
import { formatTokenCount, getUsageStatus, getUsageStatusBadgeColor } from '../../utils/usageFormatters';

interface LicenseCardProps {
  license: License;
  onArchive: (id: string) => void;
  onReactivate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyInvite: (invitationToken: string) => void;
  onClick?: (license: License) => void;
}

export function LicenseCard({ license, onArchive, onReactivate, onDelete, onCopyInvite, onClick }: LicenseCardProps) {
  const { profile } = useAuth();
  const { usage } = useUserGrokUsage(license.user_id || undefined, profile?.entity_id || undefined);

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(license);
    }
  };

  const handleButtonClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation();
    callback();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = () => {
    switch (license.status) {
      case 'invited':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" />
            Pending Invitation
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        );
    }
  };

  const getLicenseTypeBadge = () => {
    const label = license.license_type === 'admin' ? 'Accountant' : 'Guest';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        license.license_type === 'admin'
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
      }`}>
        {label}
      </span>
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-lg border p-5 transition-all bg-white border-gray-200 dark:bg-black/40 dark:backdrop-blur-sm dark:border-emerald-500/30 ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {license.user_id ? (
              <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            ) : (
              <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {license.invited_email}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {getLicenseTypeBadge()}
            {getStatusBadge()}
          </div>
          {license.status === 'invited' && (
            <div>
              <button
                onClick={(e) => handleButtonClick(e, () => onCopyInvite(license.invitation_token))}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Copy Invite Link
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          {license.status === 'archived' ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => handleButtonClick(e, () => onReactivate(license.id))}
                title="Reactivate license"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => handleButtonClick(e, () => onDelete(license.id))}
                title="Delete license"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => handleButtonClick(e, () => onArchive(license.id))}
              title="Archive license"
            >
              <Archive className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Invited</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {formatDate(license.invitation_sent_at)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Account Status</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {license.user_id ? 'Created' : 'Not Created'}
          </p>
        </div>
        {license.accepted_at && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">Accepted</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(license.accepted_at)}
            </p>
          </div>
        )}
        {license.archived_at && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">Archived</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(license.archived_at)}
            </p>
          </div>
        )}
      </div>

      {license.user_id && license.status === 'active' && usage && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Usage This Month</span>
            </div>
            {usage.is_over_limit && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Tokens</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatTokenCount(usage.total_tokens)}</span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usage.usage_percentage >= 100
                    ? 'bg-red-500'
                    : usage.usage_percentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, usage.usage_percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                {formatTokenCount(usage.total_tokens)} / {formatTokenCount(usage.monthly_limit)}
              </span>
              <span className={`font-medium px-2 py-0.5 rounded-full border ${getUsageStatusBadgeColor(getUsageStatus(usage.total_tokens, usage.monthly_limit), document.documentElement.classList.contains('dark'))}`}>
                {usage.usage_percentage.toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{usage.total_calls} API calls</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
