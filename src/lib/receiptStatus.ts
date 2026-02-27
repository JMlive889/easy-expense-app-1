import { supabase } from './supabase';

export type ReceiptStatus = 'submitted' | 'approved' | 'flagged' | 'batched';

export interface ReceiptStatusCounts {
  submitted: number;
  approved: number;
  flagged: number;
  batched: number;
}

const RECEIPT_TYPES = ['receipt', 'meal', 'travel', 'office-supplies', 'equipment', 'utilities'];

export async function getReceiptStatusCounts(entityId?: string): Promise<{ data: ReceiptStatusCounts | null; error: any }> {
  try {
    let query = supabase
      .from('documents')
      .select('status', { count: 'exact', head: false });

    query = query.in('type', RECEIPT_TYPES);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching receipt status counts:', error);
      return { data: null, error };
    }

    const counts: ReceiptStatusCounts = {
      submitted: 0,
      approved: 0,
      flagged: 0,
      batched: 0,
    };

    if (data) {
      data.forEach((doc: any) => {
        const status = doc.status as ReceiptStatus;
        if (status in counts) {
          counts[status]++;
        }
      });
    }

    return { data: counts, error: null };
  } catch (error) {
    console.error('Unexpected error fetching receipt status counts:', error);
    return { data: null, error };
  }
}

export function isReceiptType(type?: string): boolean {
  return type ? RECEIPT_TYPES.includes(type) : false;
}

export function getReceiptStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: 'Submitted',
    approved: 'Approved',
    flagged: 'Flagged',
    batched: 'Batched',
  };
  return labels[status] || status;
}

export function getReceiptStatusColor(status: string): string {
  const colors: Record<string, string> = {
    submitted: 'blue',
    approved: 'green',
    flagged: 'red',
    batched: 'purple',
  };
  return colors[status] || 'gray';
}
