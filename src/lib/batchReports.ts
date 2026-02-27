import { supabase } from './supabase';

export interface SavedReport {
  id: string;
  user_id: string;
  entity_id: string;
  report_name: string;
  visible_columns: string[];
  column_order: string[];
  created_at: string;
  updated_at: string;
}

export async function getSavedReports(entityId: string): Promise<SavedReport[]> {
  const { data, error } = await supabase
    .from('saved_reports')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved reports:', error);
    throw error;
  }

  return data || [];
}

export async function createSavedReport(
  entityId: string,
  reportName: string,
  visibleColumns: string[],
  columnOrder: string[]
): Promise<SavedReport> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('saved_reports')
    .insert({
      user_id: user.id,
      entity_id: entityId,
      report_name: reportName,
      visible_columns: visibleColumns,
      column_order: columnOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating saved report:', error);
    throw error;
  }

  return data;
}

export async function updateSavedReport(
  reportId: string,
  reportName: string,
  visibleColumns: string[],
  columnOrder: string[]
): Promise<SavedReport> {
  const { data, error } = await supabase
    .from('saved_reports')
    .update({
      report_name: reportName,
      visible_columns: visibleColumns,
      column_order: columnOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error updating saved report:', error);
    throw error;
  }

  return data;
}

export async function deleteSavedReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting saved report:', error);
    throw error;
  }
}

export const AVAILABLE_COLUMNS = [
  { key: 'display_name', label: 'Name' },
  { key: 'user_name', label: 'User' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'amount', label: 'Amount' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'billable', label: 'Billable' },
  { key: 'reimbursable', label: 'Reimbursable' },
  { key: 'expense_report', label: 'Expense Report' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'created_at', label: 'Created Date' },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags' },
  { key: 'unique_id', label: 'Unique ID' },
  { key: 'url', label: 'URL' },
];

export const DEFAULT_VISIBLE_COLUMNS = [
  'display_name',
  'user_name',
  'vendor',
  'amount',
  'category',
  'status',
  'created_at',
];
