import React, { useState, useEffect, useMemo } from 'react'
import { FileText, Plus, Receipt, Calendar, Hash } from 'lucide-react'
import { PageType } from '../App'
import { AppHeader } from '../components/AppHeader'
import { DragDropZone } from '../components/documents/DragDropZone'
import { UploadModal } from '../components/documents/UploadModal'
import { SearchBar } from '../components/documents/SearchBar'
import { FilterChips, FilterState } from '../components/documents/FilterChips'
import { FilterModal } from '../components/documents/FilterModal'
import { ViewToggle, ViewMode } from '../components/documents/ViewToggle'
import { DocumentCard } from '../components/documents/DocumentCard'
import { DocumentListItem } from '../components/documents/DocumentListItem'
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal'
import { UploadButton } from '../components/documents/UploadButton'
import { ExpenseReportModal } from '../components/documents/ExpenseReportModal'
import { ExpenseReportDetailModal } from '../components/documents/ExpenseReportDetailModal'
import { ManageReceiptsModal } from '../components/documents/ManageReceiptsModal'
import { EnterMultipleForm } from '../components/documents/EnterMultipleForm'
import { Document, getDocuments, updateDocument, getChildImageCount, getEntityExpenseReports } from '../lib/documents'
import { ExpenseReport, getExpenseReports } from '../lib/expenseReports'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useDeleteDocument } from '../hooks/useDocuments'
import { LoadMoreButton } from '../components/ui/LoadMoreButton'
import { Tabs } from '../components/ui/Tabs'

const RECEIPTS_PAGE_SIZE = 20
const ER_PAGE_SIZE = 10

type ReceiptTab = 'receipts' | 'expense-reports' | 'enter-multiple'

interface ReceiptsProps {
  onNavigate: (page: PageType) => void
}

export function Receipts({ onNavigate }: ReceiptsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<ReceiptTab>('receipts')
  const [filters, setFilters] = useState<FilterState>({
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
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [imageCounts, setImageCounts] = useState<{ [key: string]: number }>({})
  const [visibleCount, setVisibleCount] = useState(RECEIPTS_PAGE_SIZE)

  const [expenseReports, setExpenseReports] = useState<ExpenseReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [erSearchQuery, setErSearchQuery] = useState('')
  const [visibleErCount, setVisibleErCount] = useState(ER_PAGE_SIZE)
  const [showExpenseReportModal, setShowExpenseReportModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ExpenseReport | null>(null)
  const [showReportDetailModal, setShowReportDetailModal] = useState(false)
  const [showManageReceiptsModal, setShowManageReceiptsModal] = useState(false)

  const { theme } = useTheme()
  const { showToast } = useToast()
  const { profile, updateProfile, entity } = useAuth()
  const deleteDocument = useDeleteDocument()

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (profile?.view_preference) {
      setViewMode(profile.view_preference as ViewMode)
    }
  }, [profile])

  useEffect(() => {
    applyFilters()
  }, [documents, searchQuery, filters, activeTab])

  useEffect(() => {
    setVisibleCount(RECEIPTS_PAGE_SIZE)
  }, [searchQuery, filters, activeTab])

  useEffect(() => {
    if (activeTab === 'expense-reports' && entity?.id) {
      loadExpenseReports()
    }
  }, [activeTab, entity?.id])

  useEffect(() => {
    setVisibleErCount(ER_PAGE_SIZE)
  }, [erSearchQuery])

  const handleViewModeChange = async (newViewMode: ViewMode) => {
    setViewMode(newViewMode)
    try {
      await updateProfile({ view_preference: newViewMode })
    } catch (error) {
      console.error('Failed to save view preference:', error)
    }
  }

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const { data, error } = await getDocuments()
      if (error) throw error

      const receipts = (data || []).filter(doc => doc.type === 'receipt')
      setDocuments(receipts)

      const counts: { [key: string]: number } = {}
      await Promise.all(
        receipts
          .filter(doc => doc.mime_type.startsWith('image/'))
          .map(async (doc) => {
            const { data: count } = await getChildImageCount(doc.id)
            if (count !== null && count > 0) {
              counts[doc.id] = count + 1
            }
          })
      )
      setImageCounts(counts)
    } catch (error) {
      console.error('Failed to load receipts:', error)
      showToast('Failed to load receipts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadExpenseReports = async () => {
    if (!entity?.id) return
    setLoadingReports(true)
    try {
      const { data, error } = await getExpenseReports(entity.id)
      if (error) throw error
      setExpenseReports(data || [])
    } catch (error) {
      console.error('Failed to load expense reports:', error)
      showToast('Failed to load expense reports', 'error')
    } finally {
      setLoadingReports(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...documents]

    if (activeTab === 'expense-reports') {
      filtered = []
    } else {
      const showBatched = filters.statuses.includes('batched')
      if (!showBatched) {
        filtered = filtered.filter(doc => doc.status !== 'batched')
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.display_name.toLowerCase().includes(query) ||
        doc.original_name.toLowerCase().includes(query) ||
        doc.notes?.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (filters.types.length > 0) {
      filtered = filtered.filter(doc => doc.category && filters.types.includes(doc.category))
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(doc =>
        doc.tags?.some(tag => filters.tags.includes(tag))
      )
    }

    if (filters.statuses.length > 0) {
      filtered = filtered.filter(doc => filters.statuses.includes(doc.status))
    }

    if (filters.bookmarked) {
      filtered = filtered.filter(doc => doc.bookmark)
    }

    if (filters.billable) {
      filtered = filtered.filter(doc => doc.billable)
    }

    if (filters.reimbursable) {
      filtered = filtered.filter(doc => doc.reimbursable)
    }

    if (filters.vendor) {
      filtered = filtered.filter(doc => doc.vendor === filters.vendor)
    }

    if (filters.expenseReport) {
      filtered = filtered.filter(doc => doc.expense_report === filters.expenseReport)
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(doc => new Date(doc.created_at) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(doc => new Date(doc.created_at) <= toDate)
    }

    setFilteredDocuments(filtered)
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
    setShowUploadModal(true)
  }

  const handleCameraCapture = (files: File[]) => {
    setSelectedFiles(files)
    setShowUploadModal(true)
  }

  const handleUploadComplete = () => {
    loadDocuments()
    setSelectedFiles([])
  }

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document)
    setShowDetailModal(true)
  }

  const handleToggleBookmark = async (document: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { error } = await updateDocument(document.id, { bookmark: !document.bookmark })
      if (error) throw error

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === document.id ? { ...doc, bookmark: !doc.bookmark } : doc
        )
      )
      showToast(document.bookmark ? 'Bookmark removed' : 'Bookmark added', 'success')
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      showToast('Failed to update bookmark', 'error')
    }
  }

  const handleDetailUpdate = () => loadDocuments()
  const handleDetailDelete = () => loadDocuments()

  const availableTags = Array.from(new Set(documents.flatMap(doc => doc.tags || []))).sort()
  const availableVendors = Array.from(new Set(documents.map(doc => doc.vendor).filter(Boolean) as string[])).sort()
  const availableExpenseReports = Array.from(new Set(documents.map(doc => doc.expense_report).filter(Boolean) as string[])).sort()

  const visibleDocuments = useMemo(() => filteredDocuments.slice(0, visibleCount), [filteredDocuments, visibleCount])

  const filteredErReports = useMemo(() => {
    if (!erSearchQuery.trim()) return expenseReports
    const q = erSearchQuery.toLowerCase()
    return expenseReports.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.report_number_display.toLowerCase().includes(q)
    )
  }, [expenseReports, erSearchQuery])

  const visibleErReports = useMemo(() => filteredErReports.slice(0, visibleErCount), [filteredErReports, visibleErCount])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'batched': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Receipts"
        currentPage="receipts"
        onNavigate={onNavigate}
        headerVisible={profile?.header_visible ?? true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 lg:pb-8">
        {(entity?.show_create_reports_default || entity?.show_enter_multiple_default) && (
          <div className="mb-6">
            <Tabs
              tabs={[
                { value: 'receipts', label: 'Receipts' },
                ...(entity?.show_create_reports_default ? [{ value: 'expense-reports', label: 'Expense Reports' }] : []),
                ...(entity?.show_enter_multiple_default ? [{ value: 'enter-multiple', label: 'Enter Multiple' }] : [])
              ]}
              activeTab={activeTab}
              onChange={(value) => setActiveTab(value as ReceiptTab)}
            />
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="mb-8">
            <DragDropZone onFilesSelected={handleFilesSelected} />
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="space-y-4 mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search receipts..."
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 overflow-hidden">
                <FilterChips
                  filters={filters}
                  onFilterChange={setFilters}
                  onOpenFilterModal={() => setShowFilterModal(true)}
                  showBookmarks={true}
                />
              </div>
              <ViewToggle view={viewMode} onChange={handleViewModeChange} />
            </div>
          </div>
        )}

        {activeTab === 'enter-multiple' ? (
          <EnterMultipleForm
            availableVendors={availableVendors}
            availableTags={availableTags}
            onSuccess={() => {
              loadDocuments()
              setActiveTab('receipts')
            }}
          />
        ) : activeTab === 'expense-reports' ? (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <SearchBar
                  value={erSearchQuery}
                  onChange={setErSearchQuery}
                  placeholder="Search expense reports..."
                />
              </div>
              <button
                onClick={() => setShowExpenseReportModal(true)}
                className="ml-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm hover:shadow-md flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Report</span>
              </button>
            </div>

            {loadingReports ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : filteredErReports.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {erSearchQuery ? 'No matching reports' : 'No expense reports yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {erSearchQuery
                    ? 'Try a different search term'
                    : 'Group your receipts into expense reports to stay organized — by trip, project, or client.'}
                </p>
                {!erSearchQuery && (
                  <button
                    onClick={() => setShowExpenseReportModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Report
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {visibleErReports.map(report => (
                    <button
                      key={report.id}
                      onClick={() => { setSelectedReport(report); setShowReportDetailModal(true) }}
                      className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                              {report.report_number_display}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-1 truncate">
                            {report.title}
                          </h3>
                          {report.creator_name && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{report.creator_name}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                        <div className="hidden sm:flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-gray-900 dark:text-white">
                            <Receipt className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold">{report.receipt_count}</span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">receipt{report.receipt_count !== 1 ? 's' : ''}</span>
                        </div>

                        {report.total_amount != null && report.total_amount > 0 && (
                          <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${report.total_amount.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">total</span>
                          </div>
                        )}

                        <div className="hidden md:flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs">{formatDate(report.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <LoadMoreButton
                  visibleCount={visibleErCount}
                  totalCount={filteredErReports.length}
                  onLoadMore={() => setVisibleErCount(c => c + ER_PAGE_SIZE)}
                  label="expense reports"
                  increment={ER_PAGE_SIZE}
                />

                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowExpenseReportModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create Expense Report
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {!loading && (searchQuery || filters.types.length > 0 || filters.tags.length > 0 || filters.statuses.length > 0 || filters.bookmarked || filters.billable || filters.reimbursable || filters.vendor || filters.expenseReport || filters.dateFrom || filters.dateTo) && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You have {filteredDocuments.length} result{filteredDocuments.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-600 mb-4">
                  <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {documents.length === 0 ? 'No receipts yet' : 'No receipts found'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {documents.length === 0 ? 'Use the + button below to upload your first receipt' : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visibleDocuments.map(document => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onClick={() => handleDocumentClick(document)}
                      onToggleBookmark={(e) => handleToggleBookmark(document, e)}
                      imageCount={imageCounts[document.id]}
                      showAmount
                    />
                  ))}
                </div>
                <LoadMoreButton
                  visibleCount={visibleCount}
                  totalCount={filteredDocuments.length}
                  onLoadMore={() => setVisibleCount(c => c + RECEIPTS_PAGE_SIZE)}
                  label="receipts"
                  increment={RECEIPTS_PAGE_SIZE}
                />
              </>
            ) : (
              <>
                <div className="space-y-3">
                  {visibleDocuments.map(document => (
                    <DocumentListItem
                      key={document.id}
                      document={document}
                      onClick={() => handleDocumentClick(document)}
                      onToggleBookmark={(e) => handleToggleBookmark(document, e)}
                      imageCount={imageCounts[document.id]}
                      showAmount
                    />
                  ))}
                </div>
                <LoadMoreButton
                  visibleCount={visibleCount}
                  totalCount={filteredDocuments.length}
                  onLoadMore={() => setVisibleCount(c => c + RECEIPTS_PAGE_SIZE)}
                  label="receipts"
                  increment={RECEIPTS_PAGE_SIZE}
                />
              </>
            )}
          </>
        )}
      </main>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); setSelectedFiles([]) }}
        onUploadComplete={handleUploadComplete}
        pageType="receipts"
        preSelectedFiles={selectedFiles}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={setFilters}
        pageType="receipts"
        availableTags={availableTags}
        availableVendors={availableVendors}
        availableExpenseReports={availableExpenseReports}
      />

      <DocumentDetailModal
        document={selectedDocument}
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedDocument(null) }}
        onUpdate={handleDetailUpdate}
        onDelete={handleDetailDelete}
        deleteMutation={deleteDocument}
        onNavigate={onNavigate}
      />

      <ExpenseReportModal
        isOpen={showExpenseReportModal}
        onClose={() => setShowExpenseReportModal(false)}
        onSuccess={() => {
          setShowExpenseReportModal(false)
          loadExpenseReports()
          loadDocuments()
        }}
      />

      <ExpenseReportDetailModal
        report={selectedReport}
        isOpen={showReportDetailModal}
        onClose={() => { setShowReportDetailModal(false); setSelectedReport(null) }}
        onManageReceipts={() => {
          setShowReportDetailModal(false)
          setShowManageReceiptsModal(true)
        }}
        onDeleted={() => {
          loadExpenseReports()
          loadDocuments()
        }}
      />

      <ManageReceiptsModal
        isOpen={showManageReceiptsModal}
        onClose={() => {
          setShowManageReceiptsModal(false)
          setSelectedReport(null)
        }}
        report={selectedReport}
        onSuccess={() => {
          setShowManageReceiptsModal(false)
          setSelectedReport(null)
          loadExpenseReports()
          loadDocuments()
        }}
      />

      {activeTab !== 'enter-multiple' && (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 border-t px-6 py-4 pb-safe ${
          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-center">
            {activeTab === 'expense-reports' ? (
              <button
                onClick={() => setShowExpenseReportModal(true)}
                className="rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200 bg-emerald-500 text-white"
              >
                <span className="text-2xl font-bold">+</span>
              </button>
            ) : (
              <UploadButton
                onFileSelected={(file) => handleCameraCapture([file])}
                accept="image/*,application/pdf"
                title="Upload receipt"
                className="rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200 bg-emerald-500 text-white"
                icon={<span className="text-2xl font-bold">+</span>}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
