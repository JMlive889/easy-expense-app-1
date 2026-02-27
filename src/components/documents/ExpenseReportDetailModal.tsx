import React, { useState, useEffect } from 'react'
import { X, FileText, Receipt, DollarSign, Calendar, Plus, Hash, Loader2, AlertCircle, Lock, Trash2 } from 'lucide-react'
import { ExpenseReport, getReceiptsForReport, deleteExpenseReport } from '../../lib/expenseReports'
import { signedUrlCache } from '../../lib/cache/signedUrlCache'
import { useToast } from '../../contexts/ToastContext'
import ConfirmModal from '../ui/ConfirmModal'

interface ReportReceipt {
  id: string
  display_name: string
  vendor?: string
  amount?: number
  created_at: string
  mime_type: string
  file_path: string
  thumbnail_path?: string
  status: string
  type: string
}

interface ExpenseReportDetailModalProps {
  report: ExpenseReport | null
  isOpen: boolean
  onClose: () => void
  onManageReceipts: () => void
  onDeleted: () => void
}

export function ExpenseReportDetailModal({ report, isOpen, onClose, onManageReceipts, onDeleted }: ExpenseReportDetailModalProps) {
  const { showToast } = useToast()
  const [receipts, setReceipts] = useState<ReportReceipt[]>([])
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isOpen && report?.id) {
      loadReceipts()
    } else {
      setReceipts([])
      setThumbnailUrls(new Map())
      setError(null)
    }
  }, [isOpen, report?.id])

  const loadReceipts = async () => {
    if (!report?.id) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await getReceiptsForReport(report.id)
      if (fetchError) throw fetchError
      const list = (data || []) as ReportReceipt[]
      setReceipts(list)

      const thumbPaths = list.map(r => r.thumbnail_path).filter((p): p is string => !!p)
      if (thumbPaths.length > 0) {
        const urlMap = await signedUrlCache.batchGenerateOrGetCached(thumbPaths)
        setThumbnailUrls(urlMap)
      }
    } catch (err) {
      setError('Failed to load receipts for this report.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!report?.id) return
    setDeleting(true)
    try {
      const { error: deleteError } = await deleteExpenseReport(report.id)
      if (deleteError) throw deleteError

      showToast(`Deleted "${report.title}"`, 'success')
      setShowDeleteConfirm(false)
      onDeleted()
      onClose()
    } catch (err) {
      console.error('Failed to delete expense report:', err)
      showToast('Failed to delete expense report', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen || !report) return null

  const isLocked = report.status === 'batched'
  const totalAmount = receipts.reduce((sum, r) => sum + (r.amount || 0), 0)
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'batched': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md flex-shrink-0">
                  {report.report_number_display}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-1 truncate">
                {report.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col items-center py-4 px-3">
            <div className="flex items-center gap-1.5 text-gray-900 dark:text-white mb-0.5">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <span className="text-lg font-bold">{report.receipt_count ?? receipts.length}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Receipts</span>
          </div>
          <div className="flex flex-col items-center py-4 px-3">
            <div className="flex items-center gap-1 text-gray-900 dark:text-white mb-0.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-lg font-bold">
                {loading ? '—' : totalAmount > 0 ? totalAmount.toFixed(2) : '0.00'}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <div className="flex flex-col items-center py-4 px-3">
            <div className="flex items-center gap-1.5 text-gray-900 dark:text-white mb-0.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">{formatDate(report.created_at)}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Created</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Receipts in this report
          </h3>
          {isLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium">
              <Lock className="w-3.5 h-3.5" />
              Locked
            </div>
          ) : (
            <button
              onClick={onManageReceipts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Manage Receipts
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No receipts yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Add receipts to this report to get started</p>
              {!isLocked && (
                <button
                  onClick={onManageReceipts}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Manage Receipts
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map(receipt => {
                const thumbUrl = receipt.thumbnail_path ? thumbnailUrls.get(receipt.thumbnail_path) : undefined
                const isImage = receipt.mime_type.startsWith('image/')

                return (
                  <div
                    key={receipt.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {receipt.display_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {receipt.vendor && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{receipt.vendor}</span>
                        )}
                        {receipt.vendor && <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>}
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{formatDate(receipt.created_at)}</span>
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
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isLocked && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete expense report"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {!loading && receipts.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Expense Report"
        message={`Are you sure you want to delete "${report?.title}"? All receipts will be unassigned and returned to your available receipts.`}
        confirmText="Delete Report"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
