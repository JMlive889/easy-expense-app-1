import { supabase } from './supabase';
import { signedUrlCache } from './cache/signedUrlCache';
import { generateThumbnail } from './thumbnailGenerator';

export interface Document {
  id: string;
  user_id: string;
  file_path: string;
  display_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  type?: string;
  category?: string;
  status: string;
  bookmark: boolean;
  due_date?: string;
  notes?: string;
  tags?: string[];
  shared_with?: string[];
  todo_id?: string;
  vendor?: string;
  amount?: number;
  parent_document_id?: string;
  display_order: number;
  grok_analysis?: Record<string, any>;
  thumbnail_path?: string;
  billable: boolean;
  reimbursable: boolean;
  expense_report?: string;
  created_at: string;
  updated_at: string;
  signed_url?: string;
  thumbnail_url?: string;
  child_images?: Document[];
  user_name?: string;
  user_email?: string;
}

export interface UploadDocumentParams {
  file: File;
  displayName: string;
  type?: string;
  category?: string;
  notes?: string;
  tags?: string[];
  todoId?: string;
  dueDate?: string;
  vendor?: string;
  amount?: number;
  bookmarked?: boolean;
  billable?: boolean;
  reimbursable?: boolean;
  expenseReport?: string;
  parentDocumentId?: string;
  displayOrder?: number;
}

export interface UpdateDocumentParams {
  displayName?: string;
  type?: string;
  category?: string;
  notes?: string;
  tags?: string[];
  bookmark?: boolean;
  dueDate?: string;
  status?: string;
  vendor?: string;
  amount?: number;
  billable?: boolean;
  reimbursable?: boolean;
  expenseReport?: string;
  grokAnalysis?: Record<string, any>;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic'
];

const MAX_FILE_SIZE = 26214400;

export function generateFilePath(userId: string, filename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID();

  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  return `${userId}/${year}/${month}/${uuid}-${sanitizedFilename}`;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 25MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: PDF, JPEG, PNG, HEIC`
    };
  }

  return { valid: true };
}

export async function uploadDocument(params: UploadDocumentParams): Promise<{ data: Document | null; error: Error | null }> {
  try {
    const { file, displayName, type, category, notes, tags, todoId, dueDate, vendor, amount, bookmarked, billable, reimbursable, expenseReport, parentDocumentId, displayOrder } = params;

    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const filePath = generateFilePath(user.id, file.name);

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    let thumbnailPath: string | undefined;

    try {
      const thumbnailBlob = await generateThumbnail(file);

      if (thumbnailBlob) {
        const fileExtension = file.type === 'application/pdf' ? '.png' : '.jpg';
        const baseFileName = file.name.replace(/\.[^/.]+$/, '');
        const thumbnailFileName = `${baseFileName}_thumb${fileExtension}`;

        thumbnailPath = generateFilePath(user.id, thumbnailFileName);

        const { error: thumbUploadError } = await supabase.storage
          .from('documents')
          .upload(thumbnailPath, thumbnailBlob, {
            cacheControl: '3600',
            contentType: file.type === 'application/pdf' ? 'image/png' : 'image/jpeg',
            upsert: false
          });

        if (thumbUploadError) {
          console.warn('Failed to upload thumbnail:', thumbUploadError);
          thumbnailPath = undefined;
        }
      }
    } catch (thumbError) {
      console.warn('Failed to generate thumbnail:', thumbError);
      thumbnailPath = undefined;
    }

    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (urlError) {
      console.warn('Failed to generate signed URL:', urlError);
    }

    let thumbnailUrl: string | undefined;
    if (thumbnailPath) {
      const { data: thumbnailUrlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(thumbnailPath, 3600);
      thumbnailUrl = thumbnailUrlData?.signedUrl;
    }

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_path: filePath,
        display_name: displayName,
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        type,
        category,
        notes,
        tags,
        todo_id: todoId,
        due_date: dueDate,
        vendor,
        amount,
        status: 'pending',
        bookmark: bookmarked || false,
        billable: billable || false,
        reimbursable: reimbursable || false,
        expense_report: expenseReport,
        parent_document_id: parentDocumentId,
        display_order: displayOrder || 0,
        thumbnail_path: thumbnailPath
      })
      .select()
      .single();

    if (dbError) {
      const filesToDelete = [filePath];
      if (thumbnailPath) {
        filesToDelete.push(thumbnailPath);
      }
      await supabase.storage.from('documents').remove(filesToDelete);
      throw dbError;
    }

    return {
      data: {
        ...document,
        signed_url: signedUrlData?.signedUrl,
        thumbnail_url: thumbnailUrl
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to upload document')
    };
  }
}

export async function getDocuments(options?: {
  bookmark?: boolean;
  todoId?: string;
  tags?: string[];
  type?: string;
  entityId?: string;
}): Promise<{ data: Document[] | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_entity_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const targetEntityId = options?.entityId || profile?.current_entity_id;

    if (!targetEntityId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('documents')
      .select('*, profiles!inner(entity_id, current_entity_id, full_name, email)')
      .eq('profiles.entity_id', targetEntityId)
      .is('parent_document_id', null)
      .order('created_at', { ascending: false });

    if (options?.bookmark !== undefined) {
      query = query.eq('bookmark', options.bookmark);
    }

    if (options?.todoId) {
      query = query.eq('todo_id', options.todoId);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    const { data: results, error: dbError } = await query;

    if (dbError) {
      throw dbError;
    }

    if (!results || results.length === 0) {
      return { data: [], error: null };
    }

    const documents = results.map(({ profiles, ...doc }: any) => ({
      ...doc,
      user_name: profiles?.full_name || '',
      user_email: profiles?.email || ''
    }));

    const filePaths = documents.map(doc => doc.file_path);
    const thumbnailPaths = documents
      .map(doc => doc.thumbnail_path)
      .filter((path): path is string => !!path);

    const [urlMap, thumbnailUrlMap] = await Promise.all([
      signedUrlCache.batchGenerateOrGetCached(filePaths),
      thumbnailPaths.length > 0
        ? signedUrlCache.batchGenerateOrGetCached(thumbnailPaths)
        : Promise.resolve(new Map<string, string>())
    ]);

    const documentsWithUrls = documents.map(doc => ({
      ...doc,
      signed_url: urlMap.get(doc.file_path),
      thumbnail_url: doc.thumbnail_path ? thumbnailUrlMap.get(doc.thumbnail_path) : undefined
    }));

    return { data: documentsWithUrls, error: null };
  } catch (error) {
    console.error('Error in getDocuments:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch documents')
    };
  }
}

export async function getDocument(id: string): Promise<{ data: Document | null; error: Error | null }> {
  try {
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (dbError) {
      throw dbError;
    }

    if (!document) {
      return { data: null, error: null };
    }

    const signedUrl = await signedUrlCache.generateOrGetCached(document.file_path);
    const thumbnailUrl = document.thumbnail_path
      ? await signedUrlCache.generateOrGetCached(document.thumbnail_path)
      : undefined;

    return {
      data: {
        ...document,
        signed_url: signedUrl || undefined,
        thumbnail_url: thumbnailUrl
      },
      error: null
    };
  } catch (error) {
    console.error('Error in getDocument:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch document')
    };
  }
}

export async function updateDocument(
  id: string,
  params: UpdateDocumentParams
): Promise<{ data: Document | null; error: Error | null }> {
  try {
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .update({
        display_name: params.displayName,
        type: params.type,
        category: params.category,
        notes: params.notes,
        tags: params.tags,
        bookmark: params.bookmark,
        due_date: params.dueDate,
        status: params.status,
        vendor: params.vendor,
        amount: params.amount,
        billable: params.billable,
        reimbursable: params.reimbursable,
        expense_report: params.expenseReport,
        grok_analysis: params.grokAnalysis
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    const signedUrl = await signedUrlCache.generateOrGetCached(document.file_path);
    const thumbnailUrl = document.thumbnail_path
      ? await signedUrlCache.generateOrGetCached(document.thumbnail_path)
      : undefined;

    return {
      data: {
        ...document,
        signed_url: signedUrl || undefined,
        thumbnail_url: thumbnailUrl
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to update document')
    };
  }
}

export async function bulkUpdateDocumentStatus(
  documentIds: string[],
  status: string
): Promise<{ success: number; failed: number; error: Error | null }> {
  try {
    if (!documentIds || documentIds.length === 0) {
      return { success: 0, failed: 0, error: new Error('No documents selected') };
    }

    const { data, error: dbError } = await supabase
      .from('documents')
      .update({ status })
      .in('id', documentIds)
      .select('id');

    if (dbError) {
      throw dbError;
    }

    const successCount = data?.length || 0;
    const failedCount = documentIds.length - successCount;

    return {
      success: successCount,
      failed: failedCount,
      error: null
    };
  } catch (error) {
    return {
      success: 0,
      failed: documentIds.length,
      error: error instanceof Error ? error : new Error('Failed to update documents')
    };
  }
}

export async function deleteDocument(id: string): Promise<{ error: Error | null }> {
  try {
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path, thumbnail_path')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!document) {
      throw new Error('Document not found');
    }

    signedUrlCache.invalidate(document.file_path);
    if (document.thumbnail_path) {
      signedUrlCache.invalidate(document.thumbnail_path);
    }

    const filesToDelete = [document.file_path];
    if (document.thumbnail_path) {
      filesToDelete.push(document.thumbnail_path);
    }

    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove(filesToDelete);

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError);
    }

    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw dbError;
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to delete document')
    };
  }
}

export async function shareDocument(
  id: string,
  userIds: string[]
): Promise<{ error: Error | null }> {
  try {
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('shared_with')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!document) {
      throw new Error('Document not found');
    }

    const currentSharedWith = document.shared_with || [];
    const newSharedWith = Array.from(new Set([...currentSharedWith, ...userIds]));

    const { error: updateError } = await supabase
      .from('documents')
      .update({ shared_with: newSharedWith })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to share document')
    };
  }
}

export async function unshareDocument(
  id: string,
  userIds: string[]
): Promise<{ error: Error | null }> {
  try {
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('shared_with')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!document) {
      throw new Error('Document not found');
    }

    const currentSharedWith = document.shared_with || [];
    const newSharedWith = currentSharedWith.filter(
      (userId) => !userIds.includes(userId)
    );

    const { error: updateError } = await supabase
      .from('documents')
      .update({ shared_with: newSharedWith })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to unshare document')
    };
  }
}

export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return { data: data.signedUrl, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to generate signed URL')
    };
  }
}

export async function downloadDocument(filePath: string, filename: string): Promise<{ error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error) {
      throw error;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to download document')
    };
  }
}

export async function getEntityVendors(entityId: string): Promise<{ data: string[] | null; error: Error | null }> {
  try {
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('vendor, profiles!inner(entity_id)')
      .eq('profiles.entity_id', entityId)
      .not('vendor', 'is', null);

    if (dbError) {
      throw dbError;
    }

    if (!documents || documents.length === 0) {
      return { data: [], error: null };
    }

    const vendors = Array.from(
      new Set(
        documents
          .map(doc => doc.vendor)
          .filter((vendor): vendor is string => vendor !== null && vendor.trim() !== '')
      )
    ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return { data: vendors, error: null };
  } catch (error) {
    console.error('Error in getEntityVendors:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch entity vendors')
    };
  }
}

export async function getEntityExpenseReports(entityId: string): Promise<{ data: string[] | null; error: Error | null }> {
  try {
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('expense_report, profiles!inner(entity_id)')
      .eq('profiles.entity_id', entityId)
      .not('expense_report', 'is', null);

    if (dbError) {
      throw dbError;
    }

    if (!documents || documents.length === 0) {
      return { data: [], error: null };
    }

    const expenseReports = Array.from(
      new Set(
        documents
          .map(doc => doc.expense_report)
          .filter((report): report is string => report !== null && report.trim() !== '')
      )
    ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return { data: expenseReports, error: null };
  } catch (error) {
    console.error('Error in getEntityExpenseReports:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch entity expense reports')
    };
  }
}

export async function getEntityTags(entityId: string): Promise<{ data: string[] | null; error: Error | null }> {
  try {
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('tags, profiles!inner(entity_id)')
      .eq('profiles.entity_id', entityId)
      .not('tags', 'is', null);

    if (dbError) {
      throw dbError;
    }

    if (!documents || documents.length === 0) {
      return { data: [], error: null };
    }

    const tags = Array.from(
      new Set(
        documents
          .flatMap(doc => doc.tags || [])
          .filter((tag): tag is string => tag !== null && tag.trim() !== '')
      )
    ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return { data: tags, error: null };
  } catch (error) {
    console.error('Error in getEntityTags:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch entity tags')
    };
  }
}

export async function getDocumentWithImages(id: string): Promise<{ data: Document | null; error: Error | null }> {
  try {
    const { data: document, error: docError } = await getDocument(id);

    if (docError || !document) {
      return { data: null, error: docError };
    }

    const { data: childImages, error: childError } = await supabase
      .from('documents')
      .select('*')
      .eq('parent_document_id', id)
      .order('display_order', { ascending: true });

    if (childError) {
      console.error('Error fetching child images:', childError);
    }

    if (!childImages || childImages.length === 0) {
      return {
        data: {
          ...document,
          child_images: []
        },
        error: null
      };
    }

    const filePaths = childImages.map(img => img.file_path);
    const thumbnailPaths = childImages
      .map(img => img.thumbnail_path)
      .filter((path): path is string => !!path);

    const [urlMap, thumbnailUrlMap] = await Promise.all([
      signedUrlCache.batchGenerateOrGetCached(filePaths),
      thumbnailPaths.length > 0
        ? signedUrlCache.batchGenerateOrGetCached(thumbnailPaths)
        : Promise.resolve(new Map<string, string>())
    ]);

    const childImagesWithUrls = childImages.map(img => ({
      ...img,
      signed_url: urlMap.get(img.file_path),
      thumbnail_url: img.thumbnail_path ? thumbnailUrlMap.get(img.thumbnail_path) : undefined
    }));

    return {
      data: {
        ...document,
        child_images: childImagesWithUrls
      },
      error: null
    };
  } catch (error) {
    console.error('Error in getDocumentWithImages:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch document with images')
    };
  }
}

export async function getChildImageCount(documentId: string): Promise<{ data: number | null; error: Error | null }> {
  try {
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('parent_document_id', documentId);

    if (countError) {
      throw countError;
    }

    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Error in getChildImageCount:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to get child image count')
    };
  }
}
