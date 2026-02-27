import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCategorySpending, formatCurrency, CategorySpending } from '../../lib/analytics';
import { getDateRange, formatDateRangeLabel, DateRangeFilter } from '../../utils/dateRangeFilters';
import { Skeleton } from '../ui/Skeleton';

export function CategoryPieChart() {
  const { profile } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [data, setData] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.current_entity_id) return;

    const loadData = async () => {
      setLoading(true);
      const dateRange = getDateRange(dateFilter);
      const results = await fetchCategorySpending(profile.current_entity_id, dateRange);
      setData(results);
      setLoading(false);
    };

    loadData();
  }, [profile?.current_entity_id, dateFilter]);

  const topThree = data.slice(0, 3);
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Receipt Categories
        </h3>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatDateRangeLabel(dateFilter)}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
              {(['today', 'last7days', 'month', 'lastmonth'] as DateRangeFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setDateFilter(filter);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  {formatDateRangeLabel(filter)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No data available for this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payload[0].name}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Top 3 Expense Categories
            </h4>
            <div className="space-y-2">
              {topThree.map((item, index) => {
                const percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
