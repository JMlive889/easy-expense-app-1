import React from 'react'
import { ChevronDown } from 'lucide-react'

interface LoadMoreButtonProps {
  visibleCount: number
  totalCount: number
  onLoadMore: () => void
  label: string
  increment?: number
}

export function LoadMoreButton({ visibleCount, totalCount, onLoadMore, label, increment = 20 }: LoadMoreButtonProps) {
  if (visibleCount >= totalCount) return null

  const remaining = totalCount - visibleCount
  const nextLoad = Math.min(increment, remaining)

  return (
    <div className="flex flex-col items-center gap-2 pt-4 pb-2">
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Showing {visibleCount} of {totalCount} {label}
      </p>
      <button
        onClick={onLoadMore}
        className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors border border-gray-200 dark:border-gray-700"
      >
        <ChevronDown className="w-4 h-4" />
        Load {nextLoad} more
      </button>
    </div>
  )
}
