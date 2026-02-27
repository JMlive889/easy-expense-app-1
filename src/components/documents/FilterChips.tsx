import React from 'react'
import { Filter, X, Bookmark } from 'lucide-react'

export interface FilterState {
  types: string[]
  tags: string[]
  statuses: string[]
  bookmarked: boolean
  billable: boolean
  reimbursable: boolean
  vendor: string | null
  expenseReport: string | null
  dateFrom: string | null
  dateTo: string | null
}

interface FilterChipsProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  onOpenFilterModal: () => void
  showBookmarks?: boolean
}

export function FilterChips({
  filters,
  onFilterChange,
  onOpenFilterModal,
  showBookmarks = false
}: FilterChipsProps) {
  const activeFilterCount =
    filters.types.length +
    filters.tags.length +
    filters.statuses.length +
    (filters.vendor ? 1 : 0) +
    (filters.expenseReport ? 1 : 0) +
    (filters.bookmarked ? 1 : 0) +
    (filters.billable ? 1 : 0) +
    (filters.reimbursable ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0)

  const handleToggleBookmark = () => {
    onFilterChange({
      ...filters,
      bookmarked: !filters.bookmarked
    })
  }

  const handleRemoveType = (type: string) => {
    onFilterChange({
      ...filters,
      types: filters.types.filter(t => t !== type)
    })
  }

  const handleRemoveTag = (tag: string) => {
    onFilterChange({
      ...filters,
      tags: filters.tags.filter(t => t !== tag)
    })
  }

  const handleRemoveVendor = () => {
    onFilterChange({
      ...filters,
      vendor: null
    })
  }

  const handleRemoveExpenseReport = () => {
    onFilterChange({
      ...filters,
      expenseReport: null
    })
  }

  const handleRemoveDateRange = () => {
    onFilterChange({
      ...filters,
      dateFrom: null,
      dateTo: null
    })
  }

  const handleRemoveBillable = () => {
    onFilterChange({ ...filters, billable: false })
  }

  const handleRemoveReimbursable = () => {
    onFilterChange({ ...filters, reimbursable: false })
  }

  const handleClearAll = () => {
    onFilterChange({
      types: [],
      tags: [],
      statuses: [],
      bookmarked: false,
      billable: false,
      reimbursable: false,
      vendor: null,
      expenseReport: null,
      dateFrom: null,
      dateTo: null
    })
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      <button
        onClick={onOpenFilterModal}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
          ${activeFilterCount > 0
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
      >
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters</span>
      </button>

      {showBookmarks && (
        <button
          onClick={handleToggleBookmark}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
            ${filters.bookmarked
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          <Bookmark className={`w-4 h-4 ${filters.bookmarked ? 'fill-white' : ''}`} />
          <span className="font-medium">Bookmarked</span>
        </button>
      )}

      {filters.types.map(type => (
        <div
          key={type}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white whitespace-nowrap"
        >
          <span className="font-medium capitalize">{type.replace('-', ' ')}</span>
          <button
            onClick={() => handleRemoveType(type)}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {filters.tags.map(tag => (
        <div
          key={tag}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white whitespace-nowrap"
        >
          <span className="font-medium">{tag}</span>
          <button
            onClick={() => handleRemoveTag(tag)}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {filters.billable && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white whitespace-nowrap">
          <span className="font-medium">Billable</span>
          <button
            onClick={handleRemoveBillable}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {filters.reimbursable && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white whitespace-nowrap">
          <span className="font-medium">Reimbursable</span>
          <button
            onClick={handleRemoveReimbursable}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {filters.vendor && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white whitespace-nowrap">
          <span className="font-medium">{filters.vendor}</span>
          <button
            onClick={handleRemoveVendor}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {filters.expenseReport && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white whitespace-nowrap">
          <span className="font-medium">{filters.expenseReport}</span>
          <button
            onClick={handleRemoveExpenseReport}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {(filters.dateFrom || filters.dateTo) && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white whitespace-nowrap">
          <span className="font-medium">
            {filters.dateFrom && filters.dateTo
              ? `${new Date(filters.dateFrom).toLocaleDateString()} - ${new Date(filters.dateTo).toLocaleDateString()}`
              : filters.dateFrom
              ? `From ${new Date(filters.dateFrom).toLocaleDateString()}`
              : `To ${new Date(filters.dateTo!).toLocaleDateString()}`}
          </span>
          <button
            onClick={handleRemoveDateRange}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {activeFilterCount > 0 && (
        <button
          onClick={handleClearAll}
          className="px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 whitespace-nowrap transition-colors font-medium"
        >
          Clear All
        </button>
      )}
    </div>
  )
}
