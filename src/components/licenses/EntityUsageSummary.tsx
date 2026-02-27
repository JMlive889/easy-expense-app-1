import { TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { useEntityGrokUsage } from '../../hooks/useGrokUsage';
import { useAuth } from '../../contexts/AuthContext';
import { formatTokenCountLong, formatTokenCount, getCurrentMonthLabel } from '../../utils/usageFormatters';
import { getTokenLimitsByProductName, formatOveragePrice } from '../../stripe-config';

interface EntityUsageSummaryProps {
  productName: string;
}

export function EntityUsageSummary({ productName }: EntityUsageSummaryProps) {
  const { profile } = useAuth();
  const { summary, loading } = useEntityGrokUsage(profile?.entity_id || undefined);

  const entityTokenLimit = getTokenLimitsByProductName(productName);
  const usagePercentage = entityTokenLimit > 0 ? (summary?.total_tokens || 0) / entityTokenLimit * 100 : 0;
  const isOverLimit = usagePercentage >= 100;
  const isApproachingLimit = usagePercentage >= 80 && usagePercentage < 100;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 rounded-lg border border-blue-200 dark:border-blue-800/40 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-blue-200 dark:bg-blue-800 rounded w-1/3"></div>
          <div className="h-20 bg-blue-200 dark:bg-blue-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 rounded-lg border border-blue-200 dark:border-blue-800/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Entity-Wide API Usage
          </h3>
        </div>
        {(isOverLimit || isApproachingLimit) && (
          <AlertTriangle className={`w-5 h-5 ${isOverLimit ? 'text-red-500' : 'text-amber-500'}`} />
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatTokenCountLong(summary.total_tokens)}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            of {formatTokenCountLong(entityTokenLimit)} tokens
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
          <div
            className={`h-full transition-all ${
              isOverLimit
                ? 'bg-red-500'
                : isApproachingLimit
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, usagePercentage)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{getCurrentMonthLabel()}</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {usagePercentage.toFixed(1)}% used
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Calls</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_calls}</p>
        </div>

        <div className="text-center border-l border-r border-blue-200 dark:border-blue-800">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Chat</div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatTokenCount(summary.chat_tokens)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{summary.chat_calls} calls</p>
        </div>

        <div className="text-center">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Documents</div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatTokenCount(summary.document_tokens)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{summary.document_calls} calls</p>
        </div>
      </div>

      {isOverLimit && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg">
          <p className="text-xs text-red-700 dark:text-red-300">
            <strong>Warning:</strong> Your entity has exceeded the monthly token limit.
          </p>
        </div>
      )}

      {isApproachingLimit && !isOverLimit && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Notice:</strong> Your entity is approaching the monthly token limit.
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {formatOveragePrice()}
        </p>
      </div>
    </div>
  );
}
