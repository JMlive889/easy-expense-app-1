import { supabase } from './supabase';

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface CreateChatParams {
  title?: string;
  bookmarked?: boolean;
}

export interface UpdateChatParams {
  title?: string;
  bookmarked?: boolean;
}

export interface CreateMessageParams {
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function getChats(bookmarked?: boolean): Promise<Chat[]> {
  let query = supabase
    .from('chats')
    .select('*')
    .order('bookmarked', { ascending: false })
    .order('updated_at', { ascending: false });

  if (bookmarked !== undefined) {
    query = query.eq('bookmarked', bookmarked);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createChat(params: CreateChatParams = {}): Promise<Chat> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: user.id,
      title: params.title || 'New Chat',
      bookmarked: params.bookmarked || false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChat(
  chatId: string,
  params: UpdateChatParams
): Promise<Chat> {
  const { data, error } = await supabase
    .from('chats')
    .update(params)
    .eq('id', chatId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChat(chatId: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) throw error;
}

export async function toggleChatBookmark(chatId: string): Promise<Chat> {
  const chat = await getChat(chatId);
  if (!chat) {
    throw new Error('Chat not found');
  }

  return updateChat(chatId, { bookmarked: !chat.bookmarked });
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createMessage(params: CreateMessageParams): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: params.chat_id,
      role: params.role,
      content: params.content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const truncated = firstMessage.slice(0, 50);
  if (truncated.length < firstMessage.length) {
    return truncated + '...';
  }
  return truncated;
}

export async function updateChatTitle(chatId: string, firstMessage: string): Promise<void> {
  const title = await generateChatTitle(firstMessage);
  await updateChat(chatId, { title });
}
