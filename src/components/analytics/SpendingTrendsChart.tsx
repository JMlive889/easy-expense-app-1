import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchSpendingTrends, formatCurrency, TrendData } from '../../lib/analytics';
import { getDateRange, formatDateRangeLabel, DateRangeFilter } from '../../utils/dateRangeFilters';
import { Skeleton } from '../ui/Skeleton';

const LINE_COLORS = ['#10b981', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function SpendingTrendsChart() {
  const { profile } = useAuth();
  const [groupBy, setGroupBy] = useState<'user' | 'category'>('user');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('month');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.current_entity_id) return;

    const loadData = async () => {
      setLoading(true);
      const dateRange = getDateRange(dateFilter);
      const results = await fetchSpendingTrends(profile.current_entity_id, dateRange, groupBy);
      setData(results);
      setLoading(false);
    };

    loadData();
  }, [profile?.current_entity_id, dateFilter, groupBy]);

  const dataKeys = data.length > 0 ? Object.keys(data[0]).filter((key) => key !== 'date') : [];

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
          Spending Trends
        </h3>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {groupBy === 'user' ? 'By User' : 'By Category'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {isGroupDropdownOpen && (
              <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setGroupBy('user');
                    setIsGroupDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 first:rounded-t-lg transition-colors"
                >
                  By User
                </button>
                <button
                  onClick={() => {
                    setGroupBy('category');
                    setIsGroupDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 last:rounded-b-lg transition-colors"
                >
                  By Category
                </button>
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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {label}
                      </p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {entry.name}:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
