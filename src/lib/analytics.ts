import { supabase } from './supabase';
import { DateRange } from '../utils/dateRangeFilters';

export interface CategorySpending {
  category: string;
  amount: number;
  color: string;
}

export interface UserSpending {
  userId: string;
  userName: string;
  amount: number;
}

export interface TimeSeriesData {
  date: string;
  amount: number;
  label: string;
}

export interface TrendData {
  date: string;
  [key: string]: number | string;
}

const CATEGORY_COLORS = [
  '#10b981',
  '#059669',
  '#047857',
  '#065f46',
  '#064e3b',
  '#6ee7b7',
  '#34d399',
  '#a7f3d0',
];

export async function fetchCategorySpending(
  entityId: string,
  dateRange: DateRange
): Promise<CategorySpending[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('entity_memberships')
    .select('user_id')
    .eq('entity_id', entityId);

  if (membershipError) {
    console.error('Error fetching entity memberships:', membershipError);
    return [];
  }

  const userIds = memberships.map((m) => m.user_id);

  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('documents')
    .select('type, category, amount')
    .in('user_id', userIds)
    .gte('created_at', dateRange.startDate)
    .lte('created_at', dateRange.endDate)
    .not('amount', 'is', null);

  if (error) {
    console.error('Error fetching category spending:', error);
    return [];
  }

  const categoryMap = new Map<string, number>();

  data.forEach((doc) => {
    const categoryName = doc.type === 'receipt' && doc.category
      ? doc.category
      : doc.type || 'Uncategorized';
    const amount = doc.amount || 0;
    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount);
  });

  const results: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([category, amount], index) => ({
      category: formatCategoryName(category),
      amount,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  return results;
}

export async function fetchUserSpending(
  entityId: string,
  dateRange: DateRange
): Promise<UserSpending[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('entity_memberships')
    .select('user_id')
    .eq('entity_id', entityId);

  if (membershipError) {
    console.error('Error fetching entity memberships:', membershipError);
    return [];
  }

  const userIds = memberships.map((m) => m.user_id);

  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('documents')
    .select('user_id, amount, profiles(full_name)')
    .in('user_id', userIds)
    .gte('created_at', dateRange.startDate)
    .lte('created_at', dateRange.endDate)
    .not('amount', 'is', null);

  if (error) {
    console.error('Error fetching user spending:', error);
    return [];
  }

  const userMap = new Map<string, { amount: number; name: string }>();

  data.forEach((doc: any) => {
    const userId = doc.user_id;
    const amount = doc.amount || 0;
    const userName = doc.profiles?.full_name || 'Unknown User';

    if (userMap.has(userId)) {
      const existing = userMap.get(userId)!;
      userMap.set(userId, { amount: existing.amount + amount, name: userName });
    } else {
      userMap.set(userId, { amount, name: userName });
    }
  });

  const results: UserSpending[] = Array.from(userMap.entries())
    .map(([userId, { amount, name }]) => ({
      userId,
      userName: name,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  return results;
}

export async function fetchSpendingTrends(
  entityId: string,
  dateRange: DateRange,
  groupBy: 'user' | 'category'
): Promise<TrendData[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('entity_memberships')
    .select('user_id')
    .eq('entity_id', entityId);

  if (membershipError) {
    console.error('Error fetching entity memberships:', membershipError);
    return [];
  }

  const userIds = memberships.map((m) => m.user_id);

  if (userIds.length === 0) {
    return [];
  }

  const selectFields =
    groupBy === 'user'
      ? 'created_at, amount, user_id, profiles(full_name)'
      : 'created_at, amount, type, category';

  const { data, error } = await supabase
    .from('documents')
    .select(selectFields)
    .in('user_id', userIds)
    .gte('created_at', dateRange.startDate)
    .lte('created_at', dateRange.endDate)
    .not('amount', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching spending trends:', error);
    return [];
  }

  const dateMap = new Map<string, Map<string, number>>();

  data.forEach((doc: any) => {
    const date = new Date(doc.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const amount = doc.amount || 0;
    const groupKey =
      groupBy === 'user'
        ? doc.profiles?.full_name || 'Unknown'
        : doc.type === 'receipt' && doc.category
        ? doc.category
        : formatCategoryName(doc.type || 'Uncategorized');

    if (!dateMap.has(date)) {
      dateMap.set(date, new Map());
    }

    const groupMap = dateMap.get(date)!;
    groupMap.set(groupKey, (groupMap.get(groupKey) || 0) + amount);
  });

  const allGroups = new Set<string>();
  dateMap.forEach((groupMap) => {
    groupMap.forEach((_, groupKey) => allGroups.add(groupKey));
  });

  const results: TrendData[] = Array.from(dateMap.entries()).map(
    ([date, groupMap]) => {
      const dataPoint: TrendData = { date };
      allGroups.forEach((group) => {
        dataPoint[group] = groupMap.get(group) || 0;
      });
      return dataPoint;
    }
  );

  return results;
}

function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
