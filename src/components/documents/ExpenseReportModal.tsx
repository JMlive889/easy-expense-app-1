import React, { useState, useEffect, useRef, useMemo } from 'react'
import { X, Search, Plus, FileText, ChevronDown, CheckSquare, Square, Receipt, DollarSign } from 'lucide-react'
import { useClickOutside } from '../../hooks/useClickOutside'
import {
  ExpenseReport,
  getExpenseReports,
  createExpenseReport,
  addReceiptsToExpenseReport,
  getAvailableReceiptsForReport
} from '../../lib/expenseReports'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { signedUrlCache } from '../../lib/cache/signedUrlCache'

interface AvailableReceipt {
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

interface ExpenseReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CREATE_NEW_VALUE = '__create_new__'

export function ExpenseReportModal({ isOpen, onClose, onSuccess }: ExpenseReportModalProps) {
  const { profile, entity } = useAuth()
  const { showToast } = useToast()

  const [existingReports, setExistingReports] = useState<ExpenseReport[]>([])
  const [availableReceipts, setAvailableReceipts] = useState<AvailableReceipt[]>([])
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map())
  const [loadingReports, setLoadingReports] = useState(false)
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newReportTitle, setNewReportTitle] = useState('')
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<Set<string>>(new Set())

  const [reportSearchQuery, setReportSearchQuery] = useState('')
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false)
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('')

  const reportDropdownRef = useRef<HTMLDivElement>(null)
  const newTitleRef = useRef<HTMLInputElement>(null)

  useClickOutside(reportDropdownRef, () => {
    setReportDropdownOpen(false)
    setReportSearchQuery('')
  })

  useEffect(() => {
    if (isOpen && entity?.id) {
      loadData()
    }
  }, [isOpen, entity?.id])

  useEffect(() => {
    if (isCreatingNew && newTitleRef.current) {
      newTitleRef.current.focus()
    }
  }, [isCreatingNew])

  const loadData = async () => {
    if (!entity?.id) return
    setLoadingReports(true)
    setLoadingReceipts(true)

    const [reportsResult, receiptsResult] = await Promise.all([
      getExpenseReports(entity.id),
      getAvailableReceiptsForReport(entity.id)
    ])

    if (reportsResult.data) {
      setExistingReports(reportsResult.data.filter(r => r.status === 'created'))
    }
    setLoadingReports(false)

    if (receiptsResult.data) {
      const receipts = receiptsResult.data as AvailableReceipt[]
      setAvailableReceipts(receipts)

      const thumbPaths = receipts
        .map(r => r.thumbnail_path)
        .filter((p): p is string => !!p)

      if (thumbPaths.length > 0) {
        const urlMap = await signedUrlCache.batchGenerateOrGetCached(thumbPaths)
        setThumbnailUrls(urlMap)
      }
    }
    setLoadingReceipts(false)
  }

  const handleClose = () => {
    setSelectedReportId(null)
    setIsCreatingNew(false)
    setNewReportTitle('')
    setSelectedReceiptIds(new Set())
    setReportSearchQuery('')
    setReceiptSearchQuery('')
    setReportDropdownOpen(false)
    onClose()
  }

  const handleReportSelect = (reportId: string) => {
    if (reportId === CREATE_NEW_VALUE) {
      setIsCreatingNew(true)
      setSelectedReportId(null)
    } else {
      setIsCreatingNew(false)
      setSelectedReportId(reportId)
      setNewReportTitle('')
    }
    setReportDropdownOpen(false)
    setReportSearchQuery('')
  }

  const toggleReceipt = (id: string) => {
    setSelectedReceiptIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedReceiptIds.size === filteredReceipts.length) {
      setSelectedReceiptIds(new Set())
    } else {
      setSelectedReceiptIds(new Set(filteredReceipts.map(r => r.id)))
    }
  }

  const handleSave = async () => {
    if (!entity?.id || !profile?.id) return
    if (selectedReceiptIds.size === 0) return
    if (!isCreatingNew && !selectedReportId) return
    if (isCreatingNew && !newReportTitle.trim()) return

    setSaving(true)
    try {
      let reportId: string
      let reportDisplay: string

      if (isCreatingNew) {
        const { data: newReport, error } = await createExpenseReport(
          entity.id,
          profile.id,
          newReportTitle.trim()
        )
        if (error || !newReport) throw error || new Error('Failed to create report')
        reportId = newReport.id
        reportDisplay = newReport.report_number_display
      } else {
        const report = existingReports.find(r => r.id === selectedReportId)!
        reportId = report.id
        reportDisplay = report.report_number_display
      }

      const { error: addError } = await addReceiptsToExpenseReport(
        reportId,
        reportDisplay,
        Array.from(selectedReceiptIds)
      )

      if (addError) throw addError

      const reportTitle = isCreatingNew
        ? newReportTitle.trim()
        : existingReports.find(r => r.id === selectedReportId)?.title || reportDisplay

      showToast(
        `${selectedReceiptIds.size} receipt${selectedReceiptIds.size !== 1 ? 's' : ''} added to "${reportTitle}"`,
        'success'
      )
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('Failed to save expense report:', err)
      showToast('Failed to add receipts to report', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredReports = useMemo(() =>
    existingReports.filter(r =>
      r.title.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      r.report_number_display.toLowerCase().includes(reportSearchQuery.toLowerCase())
    ),
    [existingReports, reportSearchQuery]
  )

  const filteredReceipts = useMemo(() =>
    availableReceipts.filter(r =>
      r.display_name.toLowerCase().includes(receiptSearchQuery.toLowerCase()) ||
      (r.vendor && r.vendor.toLowerCase().includes(receiptSearchQuery.toLowerCase()))
    ),
    [availableReceipts, receiptSearchQuery]
  )

  const selectedReport = existingReports.find(r => r.id === selectedReportId)
  const allSelected = filteredReceipts.length > 0 && selectedReceiptIds.size === filteredReceipts.length
  const canSave = selectedReceiptIds.size > 0 &&
    (isCreatingNew ? newReportTitle.trim().length > 0 : !!selectedReportId)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (!isOpen) return null

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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Receipts to Expense Report</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select a report and choose receipts to add</p>
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
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expense Report
            </label>

            <div ref={reportDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setReportDropdownOpen(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  reportDropdownOpen
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isCreatingNew ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create New Report
                    </span>
                  ) : selectedReport ? (
                    <span className="text-gray-900 dark:text-white font-medium truncate">
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs mr-2 font-mono">{selectedReport.report_number_display}</span>
                      {selectedReport.title}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">Select or create an expense report...</span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${reportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {reportDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={reportSearchQuery}
                        onChange={e => setReportSearchQuery(e.target.value)}
                        placeholder="Search reports..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    <button
                      onClick={() => handleReportSelect(CREATE_NEW_VALUE)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-emerald-600 dark:text-emerald-400 font-medium border-b border-gray-100 dark:border-gray-700"
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span>Create New Report</span>
                    </button>

                    {loadingReports ? (
                      <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                    ) : filteredReports.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                        {reportSearchQuery ? 'No matching reports' : 'No open reports found'}
                      </div>
                    ) : (
                      filteredReports.map(report => (
                        <button
                          key={report.id}
                          onClick={() => handleReportSelect(report.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                            selectedReportId === report.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex-shrink-0">{report.report_number_display}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{report.title}</span>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {report.receipt_count} receipt{report.receipt_count !== 1 ? 's' : ''} · {formatDate(report.created_at)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {isCreatingNew && (
              <div className="mt-3">
                <input
                  ref={newTitleRef}
                  type="text"
                  value={newReportTitle}
                  onChange={e => setNewReportTitle(e.target.value)}
                  placeholder="Report name (e.g. January Travel, El Paso Kitchen)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  maxLength={120}
                />
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Receipts
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Only receipts not already in a report are shown
                </p>
              </div>
              {filteredReceipts.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-medium"
                >
                  {allSelected ? (
                    <><CheckSquare className="w-4 h-4" /> Deselect All</>
                  ) : (
                    <><Square className="w-4 h-4" /> Select All</>
                  )}
                </button>
              )}
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={receiptSearchQuery}
                onChange={e => setReceiptSearchQuery(e.target.value)}
                placeholder="Search receipts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              />
            </div>

            {loadingReceipts ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {receiptSearchQuery ? 'No matching receipts' : 'No unassigned receipts available'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  All receipts are already in an expense report
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredReceipts.map(receipt => {
                  const isSelected = selectedReceiptIds.has(receipt.id)
                  const thumbUrl = receipt.thumbnail_path ? thumbnailUrls.get(receipt.thumbnail_path) : undefined
                  const isImage = receipt.mime_type.startsWith('image/')

                  return (
                    <button
                      key={receipt.id}
                      onClick={() => toggleReceipt(receipt.id)}
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
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {receipt.display_name}
                        </p>
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
            {selectedReceiptIds.size > 0 ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedReceiptIds.size} receipt{selectedReceiptIds.size !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>No receipts selected</span>
            )}
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
              disabled={!canSave || saving}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                canSave && !saving
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : `Add ${selectedReceiptIds.size > 0 ? selectedReceiptIds.size : ''} Receipt${selectedReceiptIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
