import { supabase } from './supabase';

export interface GrokUsageRecord {
  id: string;
  user_id: string;
  entity_id: string;
  message_id: string | null;
  document_id: string | null;
  usage_type: 'chat' | 'document_analysis';
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

export interface UsageSummary {
  total_tokens: number;
  total_calls: number;
  chat_tokens: number;
  chat_calls: number;
  document_tokens: number;
  document_calls: number;
  average_tokens_per_call: number;
}

export interface UserTokenLimit {
  id: string;
  user_id: string;
  entity_id: string;
  monthly_token_limit: number;
  created_at: string;
  updated_at: string;
}

export interface UsageWithLimit extends UsageSummary {
  monthly_limit: number;
  tokens_remaining: number;
  usage_percentage: number;
  is_over_limit: boolean;
}

export async function getUserUsage(
  userId: string,
  entityId: string,
  startDate?: Date,
  endDate?: Date
): Promise<GrokUsageRecord[]> {
  let query = supabase
    .from('grok_api_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user usage:', error);
    throw error;
  }

  return data || [];
}

export async function getUserUsageSummary(
  userId: string,
  entityId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageSummary> {
  const records = await getUserUsage(userId, entityId, startDate, endDate);

  const chatRecords = records.filter(r => r.usage_type === 'chat');
  const documentRecords = records.filter(r => r.usage_type === 'document_analysis');

  const total_tokens = records.reduce((sum, r) => sum + r.total_tokens, 0);
  const chat_tokens = chatRecords.reduce((sum, r) => sum + r.total_tokens, 0);
  const document_tokens = documentRecords.reduce((sum, r) => sum + r.total_tokens, 0);

  return {
    total_tokens,
    total_calls: records.length,
    chat_tokens,
    chat_calls: chatRecords.length,
    document_tokens,
    document_calls: documentRecords.length,
    average_tokens_per_call: records.length > 0 ? Math.round(total_tokens / records.length) : 0,
  };
}

export async function getEntityUsage(
  entityId: string,
  startDate?: Date,
  endDate?: Date
): Promise<GrokUsageRecord[]> {
  let query = supabase
    .from('grok_api_usage')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching entity usage:', error);
    throw error;
  }

  return data || [];
}

export async function getEntityUsageSummary(
  entityId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageSummary> {
  const records = await getEntityUsage(entityId, startDate, endDate);

  const chatRecords = records.filter(r => r.usage_type === 'chat');
  const documentRecords = records.filter(r => r.usage_type === 'document_analysis');

  const total_tokens = records.reduce((sum, r) => sum + r.total_tokens, 0);
  const chat_tokens = chatRecords.reduce((sum, r) => sum + r.total_tokens, 0);
  const document_tokens = documentRecords.reduce((sum, r) => sum + r.total_tokens, 0);

  return {
    total_tokens,
    total_calls: records.length,
    chat_tokens,
    chat_calls: chatRecords.length,
    document_tokens,
    document_calls: documentRecords.length,
    average_tokens_per_call: records.length > 0 ? Math.round(total_tokens / records.length) : 0,
  };
}

export async function getUserTokenLimit(
  userId: string,
  entityId: string
): Promise<UserTokenLimit | null> {
  const { data, error } = await supabase
    .from('user_token_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user token limit:', error);
    throw error;
  }

  return data;
}

export async function getUserUsageWithLimit(
  userId: string,
  entityId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageWithLimit> {
  const [summary, limitRecord] = await Promise.all([
    getUserUsageSummary(userId, entityId, startDate, endDate),
    getUserTokenLimit(userId, entityId),
  ]);

  const monthly_limit = limitRecord?.monthly_token_limit || 1000000;
  const tokens_remaining = Math.max(0, monthly_limit - summary.total_tokens);
  const usage_percentage = monthly_limit > 0 ? (summary.total_tokens / monthly_limit) * 100 : 0;
  const is_over_limit = summary.total_tokens > monthly_limit;

  return {
    ...summary,
    monthly_limit,
    tokens_remaining,
    usage_percentage,
    is_over_limit,
  };
}

export async function setUserTokenLimit(
  userId: string,
  entityId: string,
  monthlyLimit: number
): Promise<UserTokenLimit> {
  const { data, error } = await supabase
    .from('user_token_limits')
    .upsert(
      {
        user_id: userId,
        entity_id: entityId,
        monthly_token_limit: monthlyLimit,
      },
      {
        onConflict: 'user_id,entity_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error setting user token limit:', error);
    throw error;
  }

  return data;
}

export async function getEntityUsageByUser(
  entityId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Map<string, UsageSummary>> {
  const records = await getEntityUsage(entityId, startDate, endDate);

  const usageByUser = new Map<string, GrokUsageRecord[]>();

  records.forEach(record => {
    const existing = usageByUser.get(record.user_id) || [];
    existing.push(record);
    usageByUser.set(record.user_id, existing);
  });

  const summaries = new Map<string, UsageSummary>();

  usageByUser.forEach((userRecords, userId) => {
    const chatRecords = userRecords.filter(r => r.usage_type === 'chat');
    const documentRecords = userRecords.filter(r => r.usage_type === 'document_analysis');

    const total_tokens = userRecords.reduce((sum, r) => sum + r.total_tokens, 0);
    const chat_tokens = chatRecords.reduce((sum, r) => sum + r.total_tokens, 0);
    const document_tokens = documentRecords.reduce((sum, r) => sum + r.total_tokens, 0);

    summaries.set(userId, {
      total_tokens,
      total_calls: userRecords.length,
      chat_tokens,
      chat_calls: chatRecords.length,
      document_tokens,
      document_calls: documentRecords.length,
      average_tokens_per_call: userRecords.length > 0 ? Math.round(total_tokens / userRecords.length) : 0,
    });
  });

  return summaries;
}

export function getMonthStartDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function getMonthEndDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}
