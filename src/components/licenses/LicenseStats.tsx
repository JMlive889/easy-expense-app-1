import { Users, Archive, Clock } from 'lucide-react';

interface LicenseStatsProps {
  title: string;
  totalAvailable: number;
  activeCount: number;
  invitedCount: number;
  archivedCount: number;
  variant: 'admin' | 'guest';
}

export function LicenseStats({
  title,
  totalAvailable,
  activeCount,
  invitedCount,
  archivedCount,
  variant
}: LicenseStatsProps) {
  const usedCount = activeCount + invitedCount;
  const availableCount = totalAvailable - usedCount;
  const usagePercentage = totalAvailable > 0 ? (usedCount / totalAvailable) * 100 : 0;

  const colorClasses =
    variant === 'admin'
      ? {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          border: 'border-purple-200',
          progress: 'bg-purple-500'
        }
      : {
          bg: 'bg-teal-100',
          text: 'text-teal-700',
          border: 'border-teal-200',
          progress: 'bg-teal-500'
        };

  return (
    <div className={`rounded-lg border p-5 ${colorClasses.border} ${colorClasses.bg} dark:bg-black/40 dark:backdrop-blur-sm dark:border-emerald-500/30`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${colorClasses.text} dark:text-white`}>{title}</h3>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
            {usedCount} of {totalAvailable} licenses in use
          </p>
        </div>
        <Users className={`w-8 h-8 ${colorClasses.text} dark:text-gray-400`} />
      </div>

      <div className="w-full rounded-full h-2 mb-4 bg-white dark:bg-slate-700/50">
        <div
          className={`${colorClasses.progress} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {activeCount}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Active</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {invitedCount}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Pending</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {archivedCount}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Archived</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white dark:border-emerald-500/30">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {availableCount > 0 ? (
            <span className="text-green-600">{availableCount} licenses available</span>
          ) : (
            <span className="text-red-600">No licenses available</span>
          )}
        </p>
      </div>
    </div>
  );
}
