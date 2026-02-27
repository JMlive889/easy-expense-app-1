export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toLocaleString();
}

export function formatTokenCountLong(tokens: number): string {
  return tokens.toLocaleString();
}

export function calculateUsagePercentage(tokensUsed: number, tokenLimit: number): number {
  if (tokenLimit === 0) return 0;
  return Math.min(100, (tokensUsed / tokenLimit) * 100);
}

export type UsageStatus = 'safe' | 'warning' | 'exceeded';

export function getUsageStatus(tokensUsed: number, tokenLimit: number): UsageStatus {
  const percentage = calculateUsagePercentage(tokensUsed, tokenLimit);

  if (percentage >= 100) return 'exceeded';
  if (percentage >= 80) return 'warning';
  return 'safe';
}

export function getUsageStatusColor(status: UsageStatus, isDarkMode: boolean = false): string {
  switch (status) {
    case 'exceeded':
      return isDarkMode ? 'text-red-400' : 'text-red-600';
    case 'warning':
      return isDarkMode ? 'text-amber-400' : 'text-amber-600';
    case 'safe':
      return isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
  }
}

export function getUsageStatusBgColor(status: UsageStatus, isDarkMode: boolean = false): string {
  switch (status) {
    case 'exceeded':
      return isDarkMode ? 'bg-red-500/20' : 'bg-red-100';
    case 'warning':
      return isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100';
    case 'safe':
      return isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100';
  }
}

export function getUsageStatusBadgeColor(status: UsageStatus, isDarkMode: boolean = false): string {
  switch (status) {
    case 'exceeded':
      return isDarkMode
        ? 'bg-red-500/20 text-red-400 border-red-500/30'
        : 'bg-red-100 text-red-700 border-red-300';
    case 'warning':
      return isDarkMode
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-amber-100 text-amber-700 border-amber-300';
    case 'safe':
      return isDarkMode
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        : 'bg-emerald-100 text-emerald-700 border-emerald-300';
  }
}

export function getUsageStatusLabel(status: UsageStatus): string {
  switch (status) {
    case 'exceeded':
      return 'Limit Exceeded';
    case 'warning':
      return 'Approaching Limit';
    case 'safe':
      return 'Within Limit';
  }
}

export function calculateOverageCost(tokensUsed: number, tokenLimit: number, pricePerThousand: number = 0.003): number {
  if (tokensUsed <= tokenLimit) return 0;
  const overageTokens = tokensUsed - tokenLimit;
  return (overageTokens / 1000) * pricePerThousand;
}

export function formatOverageCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export function formatUsagePeriod(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} - ${end}`;
}

export function getCurrentMonthLabel(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
