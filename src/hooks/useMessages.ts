import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  getInboxMessages,
  getSentMessages,
  getMessageThread,
  createReply,
  CreateReplyInput,
} from '../lib/todos';

export function useInboxMessages() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: async () => {
      const { data, error } = await getInboxMessages();
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('inbox-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', 'inbox'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useSentMessages() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', 'sent'],
    queryFn: async () => {
      const { data, error } = await getSentMessages();
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('sent-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', 'sent'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useMessageThread(taskId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['message-thread', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data, error } = await getMessageThread(taskId);
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`message-thread-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['message-thread', taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  return query;
}

export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReplyInput) => {
      const { data, error } = await createReply(input);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['message-thread', variables.parentTaskId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'sent'] });
    },
  });
}
