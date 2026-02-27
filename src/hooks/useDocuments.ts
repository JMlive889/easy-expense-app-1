import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Document,
  UploadDocumentParams,
  UpdateDocumentParams,
  uploadDocument,
  getDocuments,
  getDocument,
  getDocumentWithImages,
  updateDocument,
  deleteDocument,
} from '../lib/documents';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDocuments(options?: {
  bookmark?: boolean;
  todoId?: string;
  tags?: string[];
  type?: string;
  entityId?: string;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['documents', options],
    queryFn: async () => {
      const { data, error } = await getDocuments(options);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const channelId = `documents-changes-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useDocument(id: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await getDocument(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`document-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['document', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return query;
}

export function useDocumentWithImages(id: string | null) {
  return useQuery({
    queryKey: ['document-with-images', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await getDocumentWithImages(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadDocumentParams) => {
      const { data, error } = await uploadDocument(params);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });

      if (variables.todoId) {
        queryClient.invalidateQueries({ queryKey: ['documents', { todoId: variables.todoId }] });
      }
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateDocumentParams }) => {
      const { data, error } = await updateDocument(id, params);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['document', data.id], data);
        queryClient.setQueryData(['document-with-images', data.id], (old: Document | undefined) =>
          old ? { ...old, ...data } : data
        );
      }
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteDocument(id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['document', id] });
      queryClient.removeQueries({ queryKey: ['document-with-images', id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useToggleDocumentBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookmark }: { id: string; bookmark: boolean }) => {
      const { data, error } = await updateDocument(id, { bookmark });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, bookmark }) => {
      await queryClient.cancelQueries({ queryKey: ['document', id] });
      await queryClient.cancelQueries({ queryKey: ['documents'] });

      const previousDocument = queryClient.getQueryData(['document', id]);

      queryClient.setQueryData(['document', id], (old: Document | undefined) =>
        old ? { ...old, bookmark } : undefined
      );

      return { previousDocument };
    },
    onError: (err, { id }, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(['document', id], context.previousDocument);
      }
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['document', data.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
