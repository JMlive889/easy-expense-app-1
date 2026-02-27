import React, { useState, useEffect, useMemo } from 'react'
import { X, Search, CheckSquare, Square, FileText, DollarSign, Receipt } from 'lucide-react'
import {
  ExpenseReport,
  getReceiptsForReport,
  getAvailableReceiptsForReport,
  addReceiptsToExpenseReport,
  removeReceiptsFromExpenseReport,
  syncExpenseReportStatus
} from '../../lib/expenseReports'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { signedUrlCache } from '../../lib/cache/signedUrlCache'

interface ReceiptItem {
  id: string
  display_name: string
  vendor?: string
  amount?: number
  created_at: string
  mime_type: string
  file_path: string
  thumbnail_path?: string
  status: string
}

interface ManageReceiptsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  report: ExpenseReport | null
}

export function ManageReceiptsModal({ isOpen, onClose, onSuccess, report }: ManageReceiptsModalProps) {
  const { entity } = useAuth()
  const { showToast } = useToast()

  const [currentReceipts, setCurrentReceipts] = useState<ReceiptItem[]>([])
  const [availableReceipts, setAvailableReceipts] = useState<ReceiptItem[]>([])
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedCurrentIds, setSelectedCurrentIds] = useState<Set<string>>(new Set())
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen && entity?.id && report?.id) {
      loadData()
    }
  }, [isOpen, entity?.id, report?.id])

  const loadData = async () => {
    if (!entity?.id || !report?.id) return
    setLoading(true)

    const [currentResult, availableResult] = await Promise.all([
      getReceiptsForReport(report.id),
      getAvailableReceiptsForReport(entity.id)
    ])

    if (currentResult.data) {
      setCurrentReceipts(currentResult.data as ReceiptItem[])
      setSelectedCurrentIds(new Set(currentResult.data.map((r: ReceiptItem) => r.id)))
    }

    if (availableResult.data) {
      setAvailableReceipts(availableResult.data as ReceiptItem[])
    }

    const allReceipts = [
      ...(currentResult.data || []),
      ...(availableResult.data || [])
    ]

    const thumbPaths = allReceipts
      .map((r: any) => r.thumbnail_path)
      .filter((p): p is string => !!p)

    if (thumbPaths.length > 0) {
      const urlMap = await signedUrlCache.batchGenerateOrGetCached(thumbPaths)
      setThumbnailUrls(urlMap)
    }

    setLoading(false)
  }

  const handleClose = () => {
    setSelectedCurrentIds(new Set())
    setSelectedAvailableIds(new Set())
    setSearchQuery('')
    onClose()
  }

  const toggleCurrentReceipt = (id: string) => {
    setSelectedCurrentIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAvailableReceipt = (id: string) => {
    setSelectedAvailableIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!report) return
    setSaving(true)
    try {
      const currentReceiptIds = new Set(currentReceipts.map(r => r.id))
      const toRemove = currentReceipts
        .filter(r => !selectedCurrentIds.has(r.id))
        .map(r => r.id)

      const toAdd = Array.from(selectedAvailableIds)

      if (toRemove.length > 0) {
        const { error: removeError } = await removeReceiptsFromExpenseReport(toRemove)
        if (removeError) throw removeError
      }

      if (toAdd.length > 0) {
        const { error: addError } = await addReceiptsToExpenseReport(
          report.id,
          report.report_number_display,
          toAdd
        )
        if (addError) throw addError
      }

      await syncExpenseReportStatus(report.id)

      const totalChanges = toRemove.length + toAdd.length
      if (totalChanges > 0) {
        showToast(`Updated ${report.title}`, 'success')
      }

      onSuccess()
      handleClose()
    } catch (err) {
      console.error('Failed to update receipts:', err)
      showToast('Failed to update receipts', 'error')
    } finally {
      setSaving(false)
    }
  }

  const allReceipts = useMemo(() => {
    const current = currentReceipts.map(r => ({ ...r, isCurrent: true }))
    const available = availableReceipts.map(r => ({ ...r, isCurrent: false }))
    return [...current, ...available]
  }, [currentReceipts, availableReceipts])

  const filteredReceipts = useMemo(() =>
    allReceipts.filter(r =>
      r.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.vendor && r.vendor.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [allReceipts, searchQuery]
  )

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (!isOpen || !report) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Receipts</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs mr-2">{report.report_number_display}</span>
                {report.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select receipts to include in this report
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Currently attached receipts are checked. Uncheck to remove, or check available receipts to add.
              </p>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search receipts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              />
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {searchQuery ? 'No matching receipts' : 'No receipts available'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredReceipts.map(receipt => {
                  const isCurrent = receipt.isCurrent
                  const isSelected = isCurrent
                    ? selectedCurrentIds.has(receipt.id)
                    : selectedAvailableIds.has(receipt.id)
                  const thumbUrl = receipt.thumbnail_path ? thumbnailUrls.get(receipt.thumbnail_path) : undefined
                  const isImage = receipt.mime_type.startsWith('image/')

                  return (
                    <button
                      key={receipt.id}
                      onClick={() => isCurrent ? toggleCurrentReceipt(receipt.id) : toggleAvailableReceipt(receipt.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'text-emerald-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}>
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </div>

                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {thumbUrl || isImage ? (
                          <img
                            src={thumbUrl}
                            alt={receipt.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {receipt.display_name}
                          </p>
                          {isCurrent && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                              In Report
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {receipt.vendor && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{receipt.vendor}</span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(receipt.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {receipt.amount != null ? (
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ${receipt.amount.toFixed(2)}
                          </span>
                        ) : (
                          <DollarSign className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedCurrentIds.size + selectedAvailableIds.size} receipt{selectedCurrentIds.size + selectedAvailableIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                !saving
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
