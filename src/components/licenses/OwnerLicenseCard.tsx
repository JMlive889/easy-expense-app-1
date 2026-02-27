import { User, Crown, TrendingUp, AlertCircle } from 'lucide-react';
import { OwnerInfo } from '../../hooks/useLicenses';
import { useUserGrokUsage } from '../../hooks/useGrokUsage';
import { useAuth } from '../../contexts/AuthContext';
import { formatTokenCount, getUsageStatus, getUsageStatusBadgeColor } from '../../utils/usageFormatters';

interface OwnerLicenseCardProps {
  owner: OwnerInfo;
  onClick?: (owner: OwnerInfo) => void;
}

export function OwnerLicenseCard({ owner, onClick }: OwnerLicenseCardProps) {
  const { profile } = useAuth();
  const { usage } = useUserGrokUsage(owner.user_id, profile?.entity_id || undefined);

  const handleCardClick = () => {
    if (onClick) {
      onClick(owner);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-lg border p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-700/40 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-600' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {owner.email}
            </span>
          </div>
          {owner.full_name && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {owner.full_name}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              <Crown className="w-3 h-3" />
              Owner
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p className="flex items-center gap-2">
          <span className="font-medium">License Usage:</span>
          <span>1 of 1 (Owner)</span>
        </p>
        <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">
          The owner role cannot be transferred or removed
        </p>
      </div>

      {usage && (
        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
