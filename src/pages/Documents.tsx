import React, { useState, useEffect, useMemo } from 'react'
import { PageType } from '../App'
import { AppHeader } from '../components/AppHeader'
import { DragDropZone } from '../components/documents/DragDropZone'
import { UploadModal } from '../components/documents/UploadModal'
import { UploadButton } from '../components/documents/UploadButton'
import { SearchBar } from '../components/documents/SearchBar'
import { FilterChips, FilterState } from '../components/documents/FilterChips'
import { FilterModal } from '../components/documents/FilterModal'
import { ViewToggle, ViewMode } from '../components/documents/ViewToggle'
import { DocumentCard } from '../components/documents/DocumentCard'
import { DocumentListItem } from '../components/documents/DocumentListItem'
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal'
import { Document, getDocuments, updateDocument, getChildImageCount } from '../lib/documents'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useDeleteDocument } from '../hooks/useDocuments'
import { LoadMoreButton } from '../components/ui/LoadMoreButton'

const DOCS_PAGE_SIZE = 20

interface DocumentsProps {
  onNavigate: (page: PageType) => void
  initialDocumentId?: string
}

export function Documents({ onNavigate, initialDocumentId }: DocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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
  const [visibleCount, setVisibleCount] = useState(DOCS_PAGE_SIZE)
  const { theme } = useTheme()
  const { showToast } = useToast()
  const { profile, updateProfile } = useAuth()
  const deleteDocument = useDeleteDocument()

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (initialDocumentId && documents.length > 0) {
      const doc = documents.find(d => d.id === initialDocumentId)
      if (doc) {
        setSelectedDocument(doc)
        setShowDetailModal(true)
      }
    }
  }, [initialDocumentId, documents])

  useEffect(() => {
    if (profile?.view_preference) {
      setViewMode(profile.view_preference as ViewMode)
    }
  }, [profile])

  useEffect(() => {
    applyFilters()
  }, [documents, searchQuery, filters])

  useEffect(() => {
    setVisibleCount(DOCS_PAGE_SIZE)
  }, [searchQuery, filters])

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

      if (error) {
        throw error
      }

      const docs = (data || []).filter(doc => doc.type !== 'receipt')
      setDocuments(docs)

      const counts: { [key: string]: number } = {}
      await Promise.all(
        docs
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
      console.error('Failed to load documents:', error)
      showToast('Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...documents]

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
      filtered = filtered.filter(doc => doc.type && filters.types.includes(doc.type))
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

  const handleFileSelected = (file: File) => {
    setSelectedFiles([file])
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
      const { error } = await updateDocument(document.id, {
        bookmark: !document.bookmark
      })

      if (error) {
        throw error
      }

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === document.id
            ? { ...doc, bookmark: !doc.bookmark }
            : doc
        )
      )

      showToast(
        document.bookmark ? 'Bookmark removed' : 'Bookmark added',
        'success'
      )
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      showToast('Failed to update bookmark', 'error')
    }
  }

  const handleDetailUpdate = () => {
    loadDocuments()
  }

  const handleDetailDelete = () => {
    loadDocuments()
  }

  const availableTags = Array.from(
    new Set(documents.flatMap(doc => doc.tags || []))
  ).sort()

  const availableVendors = Array.from(
    new Set(documents.map(doc => doc.vendor).filter(Boolean) as string[])
  ).sort()

  const availableExpenseReports = Array.from(
    new Set(documents.map(doc => doc.expense_report).filter(Boolean) as string[])
  ).sort()

  const visibleDocuments = useMemo(() => filteredDocuments.slice(0, visibleCount), [filteredDocuments, visibleCount])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Documents"
        currentPage="documents"
        onNavigate={onNavigate}
        headerVisible={profile?.header_visible ?? true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 lg:pb-8">
        <div className="mb-8">
          <DragDropZone onFilesSelected={handleFilesSelected} />
        </div>

        <div className="space-y-4 mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search documents..."
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

        {!loading && (searchQuery || filters.types.length > 0 || filters.tags.length > 0 || filters.statuses.length > 0 || filters.bookmarked || filters.vendor || filters.expenseReport || filters.dateFrom || filters.dateTo) && (
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
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No documents found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {documents.length === 0
                ? 'Use the + button below to upload your first document'
                : 'Try adjusting your search or filters'}
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
                />
              ))}
            </div>
            <LoadMoreButton
              visibleCount={visibleCount}
              totalCount={filteredDocuments.length}
              onLoadMore={() => setVisibleCount(c => c + DOCS_PAGE_SIZE)}
              label="documents"
              increment={DOCS_PAGE_SIZE}
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
                />
              ))}
            </div>
            <LoadMoreButton
              visibleCount={visibleCount}
              totalCount={filteredDocuments.length}
              onLoadMore={() => setVisibleCount(c => c + DOCS_PAGE_SIZE)}
              label="documents"
              increment={DOCS_PAGE_SIZE}
            />
          </>
        )}
      </main>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          setSelectedFiles([])
        }}
        onUploadComplete={handleUploadComplete}
        pageType="documents"
        preSelectedFiles={selectedFiles}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={setFilters}
        pageType="documents"
        availableTags={availableTags}
        availableVendors={availableVendors}
        availableExpenseReports={availableExpenseReports}
      />

      <DocumentDetailModal
        document={selectedDocument}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedDocument(null)
        }}
        onUpdate={handleDetailUpdate}
        onDelete={handleDetailDelete}
        deleteMutation={deleteDocument}
        onNavigate={onNavigate}
      />

      {/* Bottom Navigation - Mobile Only */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 border-t px-6 py-4 pb-safe ${
        theme === 'dark'
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <UploadButton
            onFileSelected={handleFileSelected}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            title="Upload document"
          />
        </div>
      </div>
    </div>
  )
}
