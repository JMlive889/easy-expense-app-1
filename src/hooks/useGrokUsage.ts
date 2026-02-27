import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  getUserUsageWithLimit,
  getEntityUsageSummary,
  getEntityUsageByUser,
  getMonthStartDate,
  getMonthEndDate,
  type UsageWithLimit,
  type UsageSummary,
} from '../lib/grokUsageQueries';

export function useUserGrokUsage(userId: string | undefined, entityId: string | undefined) {
  const [usage, setUsage] = useState<UsageWithLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !entityId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        const startDate = getMonthStartDate();
        const endDate = getMonthEndDate();
        const data = await getUserUsageWithLimit(userId, entityId, startDate, endDate);
        if (isMounted) {
          setUsage(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching user usage:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch usage'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsage();

    const channel = supabase
      .channel(`grok_usage_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grok_api_usage',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [userId, entityId]);

  return { usage, loading, error, refetch: () => {
    if (userId && entityId) {
      setLoading(true);
      const startDate = getMonthStartDate();
      const endDate = getMonthEndDate();
      getUserUsageWithLimit(userId, entityId, startDate, endDate)
        .then(data => setUsage(data))
        .catch(err => setError(err instanceof Error ? err : new Error('Failed to fetch usage')))
        .finally(() => setLoading(false));
    }
  }};
}

export function useEntityGrokUsage(entityId: string | undefined) {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!entityId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        const startDate = getMonthStartDate();
        const endDate = getMonthEndDate();
        const data = await getEntityUsageSummary(entityId, startDate, endDate);
        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching entity usage:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch usage'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsage();

    const channel = supabase
      .channel(`entity_grok_usage_${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grok_api_usage',
          filter: `entity_id=eq.${entityId}`,
        },
        () => {
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [entityId]);

  return { summary, loading, error };
}

export function useEntityUsageByUser(entityId: string | undefined) {
  const [usageByUser, setUsageByUser] = useState<Map<string, UsageSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!entityId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        const startDate = getMonthStartDate();
        const endDate = getMonthEndDate();
        const data = await getEntityUsageByUser(entityId, startDate, endDate);
        if (isMounted) {
          setUsageByUser(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching entity usage by user:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch usage'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsage();

    const channel = supabase
      .channel(`entity_user_grok_usage_${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grok_api_usage',
          filter: `entity_id=eq.${entityId}`,
        },
        () => {
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [entityId]);

  return { usageByUser, loading, error };
}
