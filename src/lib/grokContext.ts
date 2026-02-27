import { supabase } from './supabase';

export type UserRole = 'owner' | 'accountant' | 'guest';

export interface UserContext {
  entityName: string;
  userRole: UserRole;
  pendingTodos: Array<{
    title: string | null;
    content: string;
    category: string;
    created_at: string;
  }>;
  recentDocuments: Array<{
    display_name: string;
    type: string | null;
    status: string;
    vendor: string | null;
    amount: number | null;
    created_at: string;
    category: string | null;
  }>;
  bookmarkedTodos: Array<{
    title: string | null;
    content: string;
    category: string;
  }>;
  bookmarkedDocuments: Array<{
    display_name: string;
    type: string | null;
  }>;
  stats: {
    totalPendingTodos: number;
    totalDocuments: number;
    totalReceipts?: number;
    totalMessages?: number;
  };
  financialSummary?: {
    totalSpending: number;
    spendingThisWeek: number;
    spendingThisMonth: number;
    topVendors: Array<{
      vendor: string;
      total: number;
      count: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      total: number;
      count: number;
    }>;
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

async function getUserRole(userId: string, entityId: string): Promise<UserRole> {
  const { data: membership } = await supabase
    .from('entity_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .maybeSingle();

  return (membership?.role as UserRole) || 'guest';
}

async function getGuestContext(userId: string, entityId: string, entityName: string): Promise<UserContext> {
  const [
    { data: pendingTodos },
    { data: recentDocuments },
    { data: bookmarkedTodos },
    { data: bookmarkedDocuments },
    { count: totalPendingCount },
    { count: totalDocsCount }
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('title, content, category, created_at')
      .eq('entity_id', entityId)
      .eq('is_completed', false)
      .is('parent_task_id', null)
      .or(`user_id.eq.${userId},assigned_users.cs.{${userId}}`)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('documents')
      .select('display_name, type, status, vendor, amount, created_at, category')
      .eq('user_id', userId)
      .or(`user_id.eq.${userId},shared_with.cs.{${userId}}`)
      .is('parent_document_id', null)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('tasks')
      .select('title, content, category')
      .eq('entity_id', entityId)
      .eq('bookmark', true)
      .is('parent_task_id', null)
      .or(`user_id.eq.${userId},assigned_users.cs.{${userId}}`)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('documents')
      .select('display_name, type')
      .eq('bookmark', true)
      .or(`user_id.eq.${userId},shared_with.cs.{${userId}}`)
      .is('parent_document_id', null)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', entityId)
      .eq('is_completed', false)
      .is('parent_task_id', null)
      .or(`user_id.eq.${userId},assigned_users.cs.{${userId}}`),

    supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},shared_with.cs.{${userId}}`)
      .is('parent_document_id', null)
  ]);

  const { count: receiptCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'receipt')
    .or(`user_id.eq.${userId},shared_with.cs.{${userId}}`)
    .is('parent_document_id', null);

  const { count: messageCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('category', 'messages')
    .or(`user_id.eq.${userId},assigned_users.cs.{${userId}}`);

  return {
    entityName,
    userRole: 'guest',
    pendingTodos: pendingTodos || [],
    recentDocuments: recentDocuments || [],
    bookmarkedTodos: bookmarkedTodos || [],
    bookmarkedDocuments: bookmarkedDocuments || [],
    stats: {
      totalPendingTodos: totalPendingCount || 0,
      totalDocuments: totalDocsCount || 0,
      totalReceipts: receiptCount || 0,
      totalMessages: messageCount || 0,
    },
  };
}

async function getOwnerAccountantContext(_userId: string, entityId: string, entityName: string, role: UserRole): Promise<UserContext> {
  const [
    { data: pendingTodos },
    { data: recentDocuments },
    { data: bookmarkedTodos },
    { data: bookmarkedDocuments },
    { count: totalPendingCount },
    { count: totalDocsCount }
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('title, content, category, created_at')
      .eq('entity_id', entityId)
      .eq('is_completed', false)
      .is('parent_task_id', null)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('documents')
      .select('display_name, type, status, vendor, amount, created_at, category, profiles!inner(entity_id)')
      .eq('profiles.entity_id', entityId)
      .is('parent_document_id', null)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('tasks')
      .select('title, content, category')
      .eq('entity_id', entityId)
      .eq('bookmark', true)
      .is('parent_task_id', null)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('documents')
      .select('display_name, type, profiles!inner(entity_id)')
      .eq('profiles.entity_id', entityId)
      .eq('bookmark', true)
      .is('parent_document_id', null)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', entityId)
      .eq('is_completed', false)
      .is('parent_task_id', null),

    supabase
      .from('documents')
      .select('*, profiles!inner(entity_id)', { count: 'exact', head: true })
      .eq('profiles.entity_id', entityId)
      .is('parent_document_id', null)
  ]);

  const { count: receiptCount } = await supabase
    .from('documents')
    .select('*, profiles!inner(entity_id)', { count: 'exact', head: true })
    .eq('profiles.entity_id', entityId)
    .eq('type', 'receipt')
    .is('parent_document_id', null);

  const { count: messageCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('category', 'messages');

  const { data: receiptsWithAmounts } = await supabase
    .from('documents')
    .select('amount, vendor, category, created_at, profiles!inner(entity_id)')
    .eq('profiles.entity_id', entityId)
    .eq('type', 'receipt')
    .not('amount', 'is', null);

  const totalSpending = receiptsWithAmounts?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const spendingThisWeek = receiptsWithAmounts?.filter(r => new Date(r.created_at) >= oneWeekAgo).reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
  const spendingThisMonth = receiptsWithAmounts?.filter(r => new Date(r.created_at) >= oneMonthAgo).reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

  const vendorMap = new Map<string, { total: number; count: number }>();
  receiptsWithAmounts?.forEach(r => {
    if (r.vendor) {
      const existing = vendorMap.get(r.vendor) || { total: 0, count: 0 };
      vendorMap.set(r.vendor, {
        total: existing.total + (r.amount || 0),
        count: existing.count + 1,
      });
    }
  });

  const topVendors = Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({ vendor, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const categoryMap = new Map<string, { total: number; count: number }>();
  receiptsWithAmounts?.forEach(r => {
    if (r.category) {
      const existing = categoryMap.get(r.category) || { total: 0, count: 0 };
      categoryMap.set(r.category, {
        total: existing.total + (r.amount || 0),
        count: existing.count + 1,
      });
    }
  });

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    entityName,
    userRole: role,
    pendingTodos: pendingTodos || [],
    recentDocuments: (recentDocuments || []).map(({ profiles, ...doc }: any) => doc),
    bookmarkedTodos: bookmarkedTodos || [],
    bookmarkedDocuments: (bookmarkedDocuments || []).map(({ profiles, ...doc }: any) => doc),
    stats: {
      totalPendingTodos: totalPendingCount || 0,
      totalDocuments: totalDocsCount || 0,
      totalReceipts: receiptCount || 0,
      totalMessages: messageCount || 0,
    },
    financialSummary: {
      totalSpending,
      spendingThisWeek,
      spendingThisMonth,
      topVendors,
      categoryBreakdown,
    },
  };
}

export async function getUserContext(): Promise<{ data: UserContext | null; error: Error | null }> {
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

    if (!profile?.current_entity_id) {
      return { data: null, error: new Error('No active entity') };
    }

    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('entity_name')
      .eq('id', profile.current_entity_id)
      .maybeSingle();

    if (entityError) {
      throw entityError;
    }

    const userRole = await getUserRole(user.id, profile.current_entity_id);

    const context = userRole === 'guest'
      ? await getGuestContext(user.id, profile.current_entity_id, entity?.entity_name || 'Unknown')
      : await getOwnerAccountantContext(user.id, profile.current_entity_id, entity?.entity_name || 'Unknown', userRole);

    return { data: context, error: null };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch user context')
    };
  }
}

export function formatContextForGrok(context: UserContext): string {
  const sections: string[] = [];

  if (context.userRole === 'guest') {
    sections.push(`You are assisting a guest user of ${context.entityName}.`);
    sections.push('');
    sections.push('IMPORTANT: You can only access this user\'s personal data and documents shared with them.');
    sections.push('You CANNOT see other users\' expenses, receipts, or entity-wide data.');
    sections.push('If asked about entity-wide information (e.g., "total company spending", "everyone\'s expenses"), politely respond:');
    sections.push('"I can only see your personal expenses and documents shared with you. For entity-wide reports, please ask an owner or accountant."');
    sections.push('');
    sections.push('=== YOUR PERSONAL DATA ===');
  } else {
    sections.push(`You are assisting ${context.entityName}.`);
    sections.push('');
    sections.push(`ACCESS LEVEL: You have full access to all entity-wide data as ${context.userRole === 'owner' ? 'an owner' : 'an accountant'}.`);
    sections.push('');
    sections.push('=== ENTITY-WIDE DATA ===');
  }

  if (context.stats.totalPendingTodos > 0 || context.stats.totalDocuments > 0 || context.stats.totalReceipts || context.stats.totalMessages) {
    sections.push('CURRENT STATS:');
    sections.push(`- Total pending tasks: ${context.stats.totalPendingTodos}`);
    sections.push(`- Total documents: ${context.stats.totalDocuments}`);
    if (context.stats.totalReceipts !== undefined) {
      sections.push(`- Total receipts: ${context.stats.totalReceipts}`);
    }
    if (context.stats.totalMessages !== undefined) {
      sections.push(`- Total messages: ${context.stats.totalMessages}`);
    }
    sections.push('');
  }

  if (context.financialSummary && context.userRole !== 'guest') {
    sections.push('FINANCIAL SUMMARY:');
    sections.push(`- Total spending: $${context.financialSummary.totalSpending.toFixed(2)}`);
    sections.push(`- Spending this week: $${context.financialSummary.spendingThisWeek.toFixed(2)}`);
    sections.push(`- Spending this month: $${context.financialSummary.spendingThisMonth.toFixed(2)}`);
    sections.push('');

    if (context.financialSummary.topVendors.length > 0) {
      sections.push('TOP VENDORS:');
      context.financialSummary.topVendors.forEach((vendor, index) => {
        sections.push(`${index + 1}. ${vendor.vendor}: $${vendor.total.toFixed(2)} (${vendor.count} transactions)`);
      });
      sections.push('');
    }

    if (context.financialSummary.categoryBreakdown.length > 0) {
      sections.push('SPENDING BY CATEGORY:');
      context.financialSummary.categoryBreakdown.forEach((cat, index) => {
        sections.push(`${index + 1}. ${cat.category}: $${cat.total.toFixed(2)} (${cat.count} items)`);
      });
      sections.push('');
    }
  }

  if (context.pendingTodos.length > 0) {
    const tasksLabel = context.userRole === 'guest' ? 'YOUR PENDING TASKS' : 'PENDING TASKS';
    sections.push(tasksLabel + ':');
    context.pendingTodos.forEach((todo, index) => {
      const title = todo.title || truncateText(todo.content, 40);
      const timeAgo = formatDate(todo.created_at);
      const categoryLabel = todo.category === 'messages' ? 'MESSAGE/TODO' : todo.category.toUpperCase();
      sections.push(`${index + 1}. [${categoryLabel}] ${title} (created ${timeAgo})`);
    });
    if (context.stats.totalPendingTodos > context.pendingTodos.length) {
      sections.push(`... and ${context.stats.totalPendingTodos - context.pendingTodos.length} more`);
    }
    sections.push('');
  }

  if (context.recentDocuments.length > 0) {
    const docsLabel = context.userRole === 'guest' ? 'YOUR RECENT DOCUMENTS' : 'RECENT DOCUMENTS';
    sections.push(docsLabel + ':');
    context.recentDocuments.forEach((doc, index) => {
      const typeLabel = doc.type ? `[${doc.type.toUpperCase()}]` : '';
      const vendorLabel = doc.vendor ? ` - Vendor: ${doc.vendor}` : '';
      const amountLabel = doc.amount ? ` - $${doc.amount.toFixed(2)}` : '';
      const categoryLabel = doc.category ? ` - Category: ${doc.category}` : '';
      const timeAgo = formatDate(doc.created_at);
      sections.push(`${index + 1}. ${typeLabel} ${doc.display_name} (${doc.status})${vendorLabel}${amountLabel}${categoryLabel} - ${timeAgo}`);
    });
    if (context.stats.totalDocuments > context.recentDocuments.length) {
      sections.push(`... and ${context.stats.totalDocuments - context.recentDocuments.length} more`);
    }
    sections.push('');
  }

  if (context.bookmarkedTodos.length > 0) {
    const bookmarksLabel = context.userRole === 'guest' ? 'YOUR BOOKMARKED TASKS' : 'BOOKMARKED TASKS';
    sections.push(bookmarksLabel + ':');
    context.bookmarkedTodos.forEach((todo, index) => {
      const title = todo.title || truncateText(todo.content, 40);
      const categoryLabel = todo.category === 'messages' ? 'MESSAGE/TODO' : todo.category.toUpperCase();
      sections.push(`${index + 1}. [${categoryLabel}] ${title}`);
    });
    sections.push('');
  }

  if (context.bookmarkedDocuments.length > 0) {
    const bookmarksLabel = context.userRole === 'guest' ? 'YOUR BOOKMARKED DOCUMENTS' : 'BOOKMARKED DOCUMENTS';
    sections.push(bookmarksLabel + ':');
    context.bookmarkedDocuments.forEach((doc, index) => {
      const typeLabel = doc.type ? `[${doc.type.toUpperCase()}]` : '';
      sections.push(`${index + 1}. ${typeLabel} ${doc.display_name}`);
    });
    sections.push('');
  }

  if (sections.length <= (context.userRole === 'guest' ? 7 : 4)) {
    const noDataMsg = context.userRole === 'guest'
      ? 'You currently have no pending tasks or documents.'
      : 'The entity currently has no pending tasks or documents.';
    sections.push(noDataMsg);
    sections.push('');
  }

  if (context.userRole === 'guest') {
    sections.push('Remember: Only answer questions about this user\'s personal data. Decline entity-wide queries politely.');
  } else {
    sections.push('Use this context to provide comprehensive, entity-wide assistance. You can answer questions about all users, spending patterns, and financial summaries.');
  }

  return sections.join('\n');
}
