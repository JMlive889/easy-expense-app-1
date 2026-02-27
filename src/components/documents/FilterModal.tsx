import React, { useState, useEffect } from 'react'
import { X, Check, Archive } from 'lucide-react'
import { FilterState } from './FilterChips'
import { useAuth } from '../../contexts/AuthContext'
import { getCategories, Category } from '../../lib/categories'
import { VendorSelect } from './VendorSelect'
import { ExpenseReportSelect } from './ExpenseReportSelect'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onApplyFilters: (filters: FilterState) => void
  pageType: 'documents' | 'receipts'
  availableTags: string[]
  availableVendors: string[]
  availableExpenseReports: string[]
}

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  pageType,
  availableTags,
  availableVendors,
  availableExpenseReports
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const { profile, entity } = useAuth()

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters, isOpen])

  useEffect(() => {
    if (isOpen && profile?.current_entity_id) {
      loadCategories()
    }
  }, [isOpen, profile?.current_entity_id])

  const loadCategories = async () => {
    if (!profile?.current_entity_id) return

    setLoadingCategories(true)
    try {
      const categoryType = pageType === 'receipts' ? 'receipt' : 'document'
      const fetchedCategories = await getCategories(profile.current_entity_id, categoryType, true)
      setCategories(fetchedCategories)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const types = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
    isArchived: cat.is_archived
  }))

  const toggleType = (type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }))
  }

  const toggleTag = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const toggleStatus = (status: string) => {
    setLocalFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }))
  }

  const handleVendorChange = (vendor: string | null) => {
    setLocalFilters(prev => ({
      ...prev,
      vendor
    }))
  }

  const handleExpenseReportChange = (expenseReport: string | null) => {
    setLocalFilters(prev => ({
      ...prev,
      expenseReport
    }))
  }

  const handleDateFromChange = (date: string) => {
    setLocalFilters(prev => ({
      ...prev,
      dateFrom: date || null
    }))
  }

  const handleDateToChange = (date: string) => {
    setLocalFilters(prev => ({
      ...prev,
      dateTo: date || null
    }))
  }

  const handleClearAll = () => {
    setLocalFilters({
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

  const handleApply = () => {
    onApplyFilters(localFilters)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Category
            </h3>
            {loadingCategories ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                Loading categories...
              </div>
            ) : types.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No categories available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {types.map(type => (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border-2 transition-all
                      ${localFilters.types.includes(type.value)
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                      ${type.isArchived ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {type.isArchived && (
                        <Archive className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </span>
                    </div>
                    {localFilters.types.includes(type.value) && (
                      <Check className="w-5 h-5 text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {availableVendors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Vendor
              </h3>
              <VendorSelect
                vendors={availableVendors}
                selectedVendor={localFilters.vendor}
                onSelect={handleVendorChange}
              />
            </div>
          )}

          {pageType === 'receipts' && entity?.show_create_reports_default && availableExpenseReports.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Expense Report
              </h3>
              <ExpenseReportSelect
                expenseReports={availableExpenseReports}
                selectedExpenseReport={localFilters.expenseReport}
                onSelect={handleExpenseReportChange}
              />
            </div>
          )}

          {pageType === 'receipts' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['submitted', 'approved', 'flagged', 'batched'].map(status => (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`
                        flex items-center justify-between p-3 rounded-xl border-2 transition-all
                        ${localFilters.statuses.includes(status)
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{status}</span>
                      {localFilters.statuses.includes(status) && <Check className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Receipt Expense Options
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLocalFilters(prev => ({ ...prev, billable: !prev.billable }))}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border-2 transition-all
                      ${localFilters.billable
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">Billable</span>
                    {localFilters.billable && <Check className="w-5 h-5 text-emerald-500" />}
                  </button>
                  <button
                    onClick={() => setLocalFilters(prev => ({ ...prev, reimbursable: !prev.reimbursable }))}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border-2 transition-all
                      ${localFilters.reimbursable
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">Reimbursable</span>
                    {localFilters.reimbursable && <Check className="w-5 h-5 text-emerald-500" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From
                </label>
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To
                </label>
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {availableTags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`
                      px-4 py-2 rounded-full transition-all
                      ${localFilters.tags.includes(tag)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
          <button
            onClick={handleClearAll}
            className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
