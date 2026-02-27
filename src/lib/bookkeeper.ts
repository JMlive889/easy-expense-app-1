import { supabase } from './supabase';

export interface BookkeeperInquiry {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface CreateBookkeeperInquiryParams {
  message: string;
}

export async function createBookkeeperInquiry(params: CreateBookkeeperInquiryParams): Promise<BookkeeperInquiry> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('bookkeeper_inquiries')
    .insert({
      user_id: user.id,
      message: params.message,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function sendBookkeeperInquiryEmail(inquiryId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-bookkeeper-email', {
    body: { inquiryId }
  });

  if (error) {
    console.error('Failed to send bookkeeper inquiry email:', error);
    throw error;
  }

  return data;
}
