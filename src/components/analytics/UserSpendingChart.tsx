import { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserSpending, formatCurrency, UserSpending } from '../../lib/analytics';
import { getDateRange, formatDateRangeLabel, DateRangeFilter } from '../../utils/dateRangeFilters';
import { Skeleton } from '../ui/Skeleton';

export function UserSpendingChart() {
  const { profile } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('month');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [data, setData] = useState<UserSpending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.current_entity_id) return;

    const loadData = async () => {
      setLoading(true);
      const dateRange = getDateRange(dateFilter);
      const results = await fetchUserSpending(profile.current_entity_id, dateRange);
      setData(results);
      setLoading(false);
    };

    loadData();
  }, [profile?.current_entity_id, dateFilter]);

  const filteredData = selectedUser === 'all' ? data : data.filter((u) => u.userId === selectedUser);
  const maxAmount = Math.max(...data.map((u) => u.amount), 1);

  const chartData = filteredData.map((user, index) => ({
    name: user.userName,
    amount: user.amount,
    fill: `hsl(${160 - index * 15}, 70%, ${50 + index * 5}%)`,
    percentage: ((user.amount / maxAmount) * 100).toFixed(1),
  }));

  const totalSpend = filteredData.reduce((sum, user) => sum + user.amount, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          User Spending
        </h3>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {selectedUser === 'all' ? 'All Users' : data.find((u) => u.userId === selectedUser)?.userName || 'Select User'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {isUserDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedUser('all');
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 first:rounded-t-lg transition-colors"
                >
                  All Users
                </button>
                {data.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => {
                      setSelectedUser(user.userId);
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 last:rounded-b-lg transition-colors"
                  >
                    {user.userName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {formatDateRangeLabel(dateFilter)}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {isDateDropdownOpen && (
              <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                {(['today', 'last7days', 'month', 'lastmonth'] as DateRangeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setDateFilter(filter);
                      setIsDateDropdownOpen(false);
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
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No data available for this period
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalSpend)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total {selectedUser === 'all' ? 'Team' : 'User'} Spend
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="90%"
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                minAngle={15}
                background
                clockWise
                dataKey="amount"
                cornerRadius={10}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {data.name}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(data.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {data.percentage}% of max
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {chartData.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: user.fill }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(user.amount)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
