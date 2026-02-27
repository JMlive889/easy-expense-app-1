import { TrendingUp, Activity, MessageSquare, FileText, AlertTriangle, Info } from 'lucide-react';
import { useUserGrokUsage } from '../../hooks/useGrokUsage';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatTokenCountLong,
  formatTokenCount,
  getUsageStatus,
  getUsageStatusLabel,
  getUsageStatusBadgeColor,
  getCurrentMonthLabel,
  calculateOverageCost,
  formatOverageCost
} from '../../utils/usageFormatters';
import { formatOveragePrice } from '../../stripe-config';
import { getUserUsage, getMonthStartDate, getMonthEndDate } from '../../lib/grokUsageQueries';
import { useState, useEffect } from 'react';

interface UsageSectionProps {
  userId: string;
}

export function UsageSection({ userId }: UsageSectionProps) {
  const { profile } = useAuth();
  const { usage, loading } = useUserGrokUsage(userId, profile?.entity_id || undefined);
  const [recentUsage, setRecentUsage] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    if (userId && profile?.entity_id) {
      const startDate = getMonthStartDate();
      const endDate = getMonthEndDate();

      getUserUsage(userId, profile.entity_id, startDate, endDate)
        .then(data => {
          setRecentUsage(data.slice(0, 10));
          setLoadingRecent(false);
        })
        .catch(err => {
          console.error('Failed to fetch recent usage:', err);
          setLoadingRecent(false);
        });
    }
  }, [userId, profile?.entity_id]);

  if (loading || loadingRecent) {
    return (
      <div className="bg-white dark:bg-black/40 dark:backdrop-blur-sm rounded-lg border border-gray-200 dark:border-emerald-500/30 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const status = getUsageStatus(usage.total_tokens, usage.monthly_limit);
  const overageCost = calculateOverageCost(usage.total_tokens, usage.monthly_limit);

  return (
    <div className="bg-white dark:bg-black/40 dark:backdrop-blur-sm rounded-lg border border-gray-200 dark:border-emerald-500/30 p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grok API Usage</h3>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getCurrentMonthLabel()}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getUsageStatusBadgeColor(status, document.documentElement.classList.contains('dark'))}`}>
            {getUsageStatusLabel(status)}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTokenCountLong(usage.total_tokens)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                of {formatTokenCountLong(usage.monthly_limit)} tokens
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
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

            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {usage.usage_percentage.toFixed(1)}% used
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatTokenCountLong(usage.tokens_remaining)} remaining
              </span>
            </div>
          </div>

          {usage.is_over_limit && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                  Token Limit Exceeded
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  This user has exceeded their monthly token limit by {formatTokenCount(usage.total_tokens - usage.monthly_limit)} tokens.
                  {overageCost > 0 && (
                    <> Estimated overage cost: {formatOverageCost(overageCost)}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {!usage.is_over_limit && usage.usage_percentage >= 80 && (
            <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Approaching Limit
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  This user has used {usage.usage_percentage.toFixed(0)}% of their monthly token allowance.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {formatOveragePrice()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total API Calls</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{usage.total_calls}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Avg: {usage.average_tokens_per_call.toLocaleString()} tokens/call
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Chat Usage</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{usage.chat_calls}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTokenCount(usage.chat_tokens)} tokens
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Document Analysis</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{usage.document_calls}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTokenCount(usage.document_tokens)} tokens
          </p>
        </div>
      </div>

      {recentUsage.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {recentUsage.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {record.usage_type === 'chat' ? (
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.usage_type === 'chat' ? 'Chat' : 'Document Analysis'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(record.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatTokenCount(record.total_tokens)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {record.model_used}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
