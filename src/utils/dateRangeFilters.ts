export type DateRangeFilter = 'today' | 'last7days' | 'month' | 'lastmonth';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function getDateRange(filter: DateRangeFilter): DateRange {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (filter) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = now;
      break;
    case 'last7days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      endDate = now;
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
      break;
    case 'lastmonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

export function formatDateRangeLabel(filter: DateRangeFilter): string {
  switch (filter) {
    case 'today':
      return 'Today';
    case 'last7days':
      return 'Last 7 Days';
    case 'month':
      return 'This Month';
    case 'lastmonth':
      return 'Last Month';
    default:
      return 'This Month';
  }
}
