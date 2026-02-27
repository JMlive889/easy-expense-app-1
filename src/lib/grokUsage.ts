import { supabase } from './supabase';
import type { GrokUsageData } from './grok';

export interface LogGrokUsageParams {
  user_id: string;
  entity_id: string;
  usage_type: 'chat' | 'document_analysis';
  usage_data: GrokUsageData;
  message_id?: string;
  document_id?: string;
}

export async function logGrokUsage(params: LogGrokUsageParams): Promise<void> {
  const {
    user_id,
    entity_id,
    usage_type,
    usage_data,
    message_id,
    document_id,
  } = params;

  try {
    const { error } = await supabase
      .from('grok_api_usage')
      .insert({
        user_id,
        entity_id,
        usage_type,
        model_used: usage_data.model_used,
        prompt_tokens: usage_data.prompt_tokens,
        completion_tokens: usage_data.completion_tokens,
        total_tokens: usage_data.total_tokens,
        message_id: message_id || null,
        document_id: document_id || null,
      });

    if (error) {
      console.error('Failed to log Grok usage:', error);
      throw error;
    }
  } catch (err) {
    console.error('Error logging Grok usage:', err);
  }
}
