export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export function DocumentCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <Skeleton className="w-full h-40 mb-3" />
      <Skeleton className="w-3/4 h-4 mb-2" />
      <Skeleton className="w-1/2 h-3" />
    </div>
  );
}

export function DocumentListItemSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center gap-4">
      <Skeleton className="w-12 h-12 flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="w-3/4 h-4 mb-2" />
        <Skeleton className="w-1/2 h-3" />
      </div>
      <Skeleton className="w-20 h-8" />
    </div>
  );
}

export function MessageListItemSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex items-start gap-3 mb-2">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="w-1/3 h-4 mb-2" />
          <Skeleton className="w-full h-3 mb-1" />
          <Skeleton className="w-2/3 h-3" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="w-16 h-6" />
        <Skeleton className="w-16 h-6" />
      </div>
    </div>
  );
}
