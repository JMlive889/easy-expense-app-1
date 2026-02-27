import { supabase } from './supabase';

export interface ExpenseReport {
  id: string;
  entity_id: string;
  user_id: string;
  report_number: number;
  report_number_display: string;
  title: string;
  status: string;
  receipt_count?: number;
  total_amount?: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_email?: string;
}

export async function getExpenseReports(entityId: string): Promise<{ data: ExpenseReport[] | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error: dbError } = await supabase
      .from('expense_reports')
      .select(`
        *,
        documents!expense_report_id(id, amount)
      `)
      .eq('entity_id', entityId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const reports: ExpenseReport[] = data.map(({ documents: docs, ...report }: any) => {
      const receipts = docs || [];
      const totalAmount = receipts.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
      return {
        ...report,
        receipt_count: receipts.length,
        total_amount: totalAmount
      };
    });

    return { data: reports, error: null };
  } catch (error) {
    console.error('Error in getExpenseReports:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch expense reports')
    };
  }
}

export async function createExpenseReport(
  entityId: string,
  userId: string,
  title: string
): Promise<{ data: ExpenseReport | null; error: Error | null }> {
  try {
    const { data: nextNumData, error: numError } = await supabase
      .rpc('get_next_er_number', { p_entity_id: entityId });

    if (numError) throw numError;

    const reportNumber = nextNumData as number;
    const reportNumberDisplay = `ER#-${String(reportNumber).padStart(7, '0')}`;

    const { data, error: dbError } = await supabase
      .from('expense_reports')
      .insert({
        entity_id: entityId,
        user_id: userId,
        report_number: reportNumber,
        report_number_display: reportNumberDisplay,
        title: title.trim(),
        status: 'created'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      data: {
        ...data,
        receipt_count: 0,
        total_amount: 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error in createExpenseReport:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to create expense report')
    };
  }
}

export async function addReceiptsToExpenseReport(
  reportId: string,
  reportNumberDisplay: string,
  documentIds: string[]
): Promise<{ error: Error | null }> {
  try {
    if (!documentIds || documentIds.length === 0) {
      return { error: new Error('No documents selected') };
    }

    const { error: dbError } = await supabase
      .from('documents')
      .update({
        expense_report_id: reportId,
        expense_report: reportNumberDisplay
      })
      .in('id', documentIds);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to add receipts to expense report')
    };
  }
}

export async function getReceiptsForReport(reportId: string): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data, error: dbError } = await supabase
      .from('documents')
      .select('id, display_name, vendor, amount, created_at, mime_type, file_path, thumbnail_path, status, type')
      .eq('expense_report_id', reportId)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getReceiptsForReport:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch receipts for report')
    };
  }
}

export async function syncExpenseReportStatus(reportId: string): Promise<{ error: Error | null }> {
  try {
    const { data: receipts, error: fetchError } = await supabase
      .from('documents')
      .select('status')
      .eq('expense_report_id', reportId);

    if (fetchError) throw fetchError;

    const list = receipts || [];
    const allBatched = list.length > 0 && list.every((r: any) => r.status === 'batched');
    const newStatus = allBatched ? 'batched' : 'created';

    const { error: updateError } = await supabase
      .from('expense_reports')
      .update({ status: newStatus })
      .eq('id', reportId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (error) {
    console.error('Error in syncExpenseReportStatus:', error);
    return {
      error: error instanceof Error ? error : new Error('Failed to sync expense report status')
    };
  }
}

export async function getAvailableReceiptsForReport(entityId: string): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data, error: dbError } = await supabase
      .from('documents')
      .select('id, display_name, vendor, amount, created_at, mime_type, file_path, thumbnail_path, status, type, profiles!inner(entity_id)')
      .eq('type', 'receipt')
      .eq('profiles.entity_id', entityId)
      .is('expense_report_id', null)
      .not('status', 'in', '("batched","flagged")')
      .is('parent_document_id', null)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    const receipts = (data || []).map(({ profiles: _p, ...doc }: any) => doc);

    return { data: receipts, error: null };
  } catch (error) {
    console.error('Error in getAvailableReceiptsForReport:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch available receipts')
    };
  }
}

export async function removeReceiptsFromExpenseReport(
  documentIds: string[]
): Promise<{ error: Error | null }> {
  try {
    if (!documentIds || documentIds.length === 0) {
      return { error: new Error('No documents selected') };
    }

    const { error: dbError } = await supabase
      .from('documents')
      .update({
        expense_report_id: null,
        expense_report: null
      })
      .in('id', documentIds);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to remove receipts from expense report')
    };
  }
}

export async function deleteExpenseReport(reportId: string): Promise<{ error: Error | null }> {
  try {
    const { data: receipts } = await supabase
      .from('documents')
      .select('id')
      .eq('expense_report_id', reportId);

    if (receipts && receipts.length > 0) {
      const receiptIds = receipts.map(r => r.id);
      const { error: removeError } = await removeReceiptsFromExpenseReport(receiptIds);
      if (removeError) throw removeError;
    }

    const { error: dbError } = await supabase
      .from('expense_reports')
      .delete()
      .eq('id', reportId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    console.error('Error in deleteExpenseReport:', error);
    return {
      error: error instanceof Error ? error : new Error('Failed to delete expense report')
    };
  }
}
