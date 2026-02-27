import React, { useState, useEffect } from 'react'
import { X, Download, Trash2, Edit2, Save, Bookmark, AlertCircle, Plus, Check, Copy, Lock } from 'lucide-react'
import { Document, updateDocument, downloadDocument, getEntityVendors, getEntityTags, getDocumentWithImages, getSignedUrl } from '../../lib/documents'
import { VendorAutocomplete } from './VendorAutocomplete'
import { TagAutocomplete } from './TagAutocomplete'
import { ImageGallery } from './ImageGallery'
import { ImageZoomModal } from './ImageZoomModal'
import { PDFInlineViewer } from './PDFInlineViewer'
import { PDFViewerModal } from './PDFViewerModal'
import { AddTodoModal } from '../todos/AddTodoModal'
import { TodoDetailModal } from '../todos/TodoDetailModal'
import { MultipleFileUploadLink } from './MultipleFileUploadLink'
import { getDocumentTodos, toggleTodoComplete, toggleTodoBookmark, Todo } from '../../lib/todos'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { AvatarStack } from '../ui/AvatarStack'
import { PageType } from '../../App'
import { createChat, createMessage } from '../../lib/chats'
import { DocumentAnalysisParams } from '../../lib/grok'
import { preparePdfForAnalysis } from '../../lib/pdfToAnalysisImage'
import { UseMutationResult } from '@tanstack/react-query'
import { isReceiptType as checkIsReceiptType, ReceiptStatus } from '../../lib/receiptStatus'
import { useEntityRole } from '../../hooks/useEntityRole'
import { getCategories, Category } from '../../lib/categories'

interface DocumentDetailModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  onDelete?: () => void
  deleteMutation?: UseMutationResult<void, Error, string, unknown>
  onNavigate?: (page: PageType, chatId?: string | null) => void
}

export function DocumentDetailModal({
  document,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  deleteMutation,
  onNavigate
}: DocumentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [billable, setBillable] = useState(false)
  const [reimbursable, setReimbursable] = useState(false)
  const [expenseReport, setExpenseReport] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [vendors, setVendors] = useState<string[]>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [entityTags, setEntityTags] = useState<string[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [fullDocument, setFullDocument] = useState<Document | null>(null)
  const [showZoomModal, setShowZoomModal] = useState(false)
  const [zoomImageIndex, setZoomImageIndex] = useState(0)
  const [preparingGrokAnalysis, setPreparingGrokAnalysis] = useState(false)
  const [pdfConversionStatus, setPdfConversionStatus] = useState<'idle' | 'converting' | 'done' | 'failed'>('idle')
  const [showAddTodoModal, setShowAddTodoModal] = useState(false)
  const [documentTodos, setDocumentTodos] = useState<any[]>([])
  const [loadingTodos, setLoadingTodos] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [showTodoDetailModal, setShowTodoDetailModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const { showToast } = useToast()
  const { profile, entity } = useAuth()
  const { role: entityRole, loading: roleLoading } = useEntityRole()

  useEffect(() => {
    const loadDocumentWithImages = async () => {
      if (document && isOpen) {
        setDisplayName(document.display_name)
        setType(document.type || '')
        setCategory(document.category || '')
        setStatus(document.status || 'submitted')
        setNotes(document.notes || '')
        setTags(document.tags || [])
        setDueDate(document.due_date || new Date().toISOString().split('T')[0])
        setVendor(document.vendor || '')
        setAmount(document.amount ? document.amount.toString() : '')
        setBookmarked(document.bookmark)
        setBillable(document.billable || false)
        setReimbursable(document.reimbursable || false)
        setExpenseReport(document.expense_report || '')

        const { data: docWithImages } = await getDocumentWithImages(document.id)
        setFullDocument(docWithImages)

        loadDocumentTodos()
      }
    }

    loadDocumentWithImages()
  }, [document, isOpen])

  const loadDocumentTodos = async () => {
    if (!document) return

    setLoadingTodos(true)
    try {
      const { data, error } = await getDocumentTodos(document.id)
      if (error) throw error
      setDocumentTodos(data || [])
    } catch (error) {
      console.error('Failed to load document todos:', error)
    } finally {
      setLoadingTodos(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
      setShowDeleteConfirm(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && profile?.current_entity_id && isEditing) {
      loadCategories()
      loadTags()
    }
  }, [isOpen, isEditing, profile?.current_entity_id])

  useEffect(() => {
    if (isOpen && profile?.current_entity_id && isEditing && document?.type === 'receipt') {
      loadVendors()
    }
  }, [isOpen, isEditing, profile?.current_entity_id, document?.type])

  const loadVendors = async () => {
    if (!profile?.current_entity_id) return

    setLoadingVendors(true)
    try {
      const { data, error } = await getEntityVendors(profile.current_entity_id)
      if (error) throw error
      setVendors(data || [])
    } catch (error) {
      console.error('Failed to load vendors:', error)
    } finally {
      setLoadingVendors(false)
    }
  }

  const loadCategories = async () => {
    if (!profile?.current_entity_id || !document) return

    setLoadingCategories(true)
    try {
      const categoryType = checkIsReceiptType(document.type) ? 'receipt' : 'document'
      const fetchedCategories = await getCategories(profile.current_entity_id, categoryType, true)
      setCategories(fetchedCategories)
    } catch (error) {
      console.error('Failed to load categories:', error)
      showToast('Failed to load categories', 'error')
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadTags = async () => {
    if (!profile?.current_entity_id) return

    setLoadingTags(true)
    try {
      const { data, error } = await getEntityTags(profile.current_entity_id)
      if (error) throw error
      setEntityTags(data || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setLoadingTags(false)
    }
  }

  const handleToggleComplete = async (todoId: string, isCompleted: boolean) => {
    setDocumentTodos(prev =>
      prev.map(todo =>
        todo.id === todoId ? { ...todo, is_completed: isCompleted } : todo
      )
    )

    try {
      const { error } = await toggleTodoComplete(todoId, isCompleted)
      if (error) {
        showToast('Failed to update todo', 'error')
        loadDocumentTodos()
      } else {
        showToast(isCompleted ? 'Todo completed' : 'Todo reopened', 'success')
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error)
      showToast('Failed to update todo', 'error')
      loadDocumentTodos()
    }
  }

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo)
    setShowTodoDetailModal(true)
  }

  const handleTodoDetailClose = () => {
    setShowTodoDetailModal(false)
    setSelectedTodo(null)
  }

  const handleTodoUpdate = () => {
    loadDocumentTodos()
  }

  if (!isOpen || !document) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await updateDocument(document.id, {
        displayName,
        type: type || undefined,
        category: category || undefined,
        status: status || undefined,
        notes: notes || undefined,
        tags: tags.length > 0 ? tags : undefined,
        dueDate: dueDate || undefined,
        vendor: vendor || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        bookmark: bookmarked,
        billable,
        reimbursable,
        expenseReport: expenseReport || undefined
      })

      if (error) {
        throw error
      }

      showToast('Document updated successfully', 'success')
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Update error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to update document', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStatus = async () => {
    setSaving(true)
    try {
      const { error } = await updateDocument(document.id, {
        status: status || undefined
      })

      if (error) {
        throw error
      }

      showToast('Status updated successfully', 'success')
      onUpdate()
    } catch (error) {
      console.error('Update error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to update status', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!document) return

    try {
      if (deleteMutation) {
        await deleteMutation.mutateAsync(document.id)
        showToast('Document deleted successfully', 'success')
      }

      if (onDelete) {
        onDelete()
      }

      onClose()
    } catch (error) {
      console.error('Delete error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to delete document', 'error')
    }
  }

  const handleDownload = async () => {
    try {
      const { error } = await downloadDocument(document.file_path, document.original_name)

      if (error) {
        throw error
      }

      showToast('Download started', 'success')
    } catch (error) {
      console.error('Download error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to download document', 'error')
    }
  }

  const handleAskGrok = async () => {
    if (!document.file_path) {
      showToast('Document file path not available', 'error')
      return
    }

    if (!onNavigate) {
      showToast('Navigation not available', 'error')
      return
    }

    setPreparingGrokAnalysis(true)

    try {
      console.log('[DocAnalysis] Generating signed URL for:', document.file_path)
      const { data: freshSignedUrl, error: urlError } = await getSignedUrl(document.file_path, 3600)

      if (urlError || !freshSignedUrl) {
        showToast('Could not generate secure document URL', 'error')
        return
      }

      console.log('[DocAnalysis] Signed URL generated — preview:', freshSignedUrl.slice(0, 100))
      console.log('[DocAnalysis] mimeType:', document.mime_type)

      const analysisParams: DocumentAnalysisParams = {
        documentId: document.id,
        documentName: document.display_name,
        fileUrl: freshSignedUrl,
        mimeType: document.mime_type,
        metadata: {
          type: document.type,
          vendor: document.vendor,
          amount: document.amount,
          tags: document.tags,
          notes: document.notes
        },
        pdfImageBase64: null,
        pdfExtractedText: null,
      }

      if (document.mime_type === 'application/pdf') {
        setPdfConversionStatus('converting')
        showToast('PDF detected — converting first page for analysis...', 'info')

        console.log('[DocAnalysis] Starting PDF conversion — URL passed to preparePdfForAnalysis:', freshSignedUrl.slice(0, 100))
        const result = await preparePdfForAnalysis(freshSignedUrl)
        console.log('[DocAnalysis] PDF conversion result — imageBase64 present:', !!result.imageBase64, '| imageBase64 length:', result.imageBase64?.length ?? 0, '| extractedText present:', !!result.extractedText, '| error:', result.conversionError)

        if (result.imageBase64) {
          analysisParams.pdfImageBase64 = result.imageBase64
          analysisParams.pdfExtractedText = result.extractedText
        } else if (result.extractedText) {
          analysisParams.pdfExtractedText = result.extractedText
          showToast('PDF image conversion unavailable — using extracted text layer instead', 'info')
        } else {
          showToast('PDF image conversion unavailable — analyzing with metadata only', 'info')
        }

        setPdfConversionStatus('done')
      }

      const chatTitle = `Analyze ${document.display_name}`
      const chat = await createChat({ title: chatTitle })

      const userPrompt = `Analyze this ${document.type || 'document'} named "${document.display_name}". Please provide detailed accounting insights.`

      await createMessage({
        chat_id: chat.id,
        role: 'user',
        content: userPrompt
      })

      console.log('[DocAnalysis] Storing analysisParams in sessionStorage — key: doc-analysis-' + chat.id, {
        documentId: analysisParams.documentId,
        mimeType: analysisParams.mimeType,
        fileUrl: analysisParams.fileUrl.slice(0, 100),
        hasPdfImageBase64: !!analysisParams.pdfImageBase64,
        pdfImageBase64Length: analysisParams.pdfImageBase64?.length ?? 0,
        hasPdfExtractedText: !!analysisParams.pdfExtractedText,
      })

      sessionStorage.setItem(`doc-analysis-${chat.id}`, JSON.stringify(analysisParams))

      showToast('Starting analysis...', 'success')

      onClose()

      onNavigate('chats', chat.id)

    } catch (error) {
      console.error('Error preparing analysis:', error)
      setPdfConversionStatus('failed')
      showToast(error instanceof Error ? error.message : 'Failed to prepare analysis', 'error')
    } finally {
      setPreparingGrokAnalysis(false)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isPDF = document.mime_type === 'application/pdf'
  const isImage = document.mime_type.startsWith('image/')

  const types = categories.map(cat => ({ value: cat.name, label: cat.name }))
  const isReceiptType = type && categories.some(cat => cat.name === type && cat.type === 'receipt')

  const isLocked = document.status === 'approved' || document.status === 'batched'
  const canEditStatus = profile?.role === 'owner' || entityRole === 'owner' || entityRole === 'accountant'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Details
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={`p-2 rounded-full transition-colors ${
                    bookmarked
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      bookmarked
                        ? 'fill-emerald-500 text-emerald-500'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLocked}
                  className={`p-2 rounded-full transition-colors ${
                    isLocked
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title={isLocked ? 'This receipt is locked' : 'Edit receipt'}
                >
                  {isLocked ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {isLocked && !isEditing && (
          <div className={`mx-6 mt-6 p-4 rounded-xl flex items-center gap-3 ${
            document.status === 'approved'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
          }`}>
            <Lock className={`w-5 h-5 flex-shrink-0 ${
              document.status === 'approved'
                ? 'text-green-600 dark:text-green-400'
                : 'text-purple-600 dark:text-purple-400'
            }`} />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${
                document.status === 'approved'
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-purple-900 dark:text-purple-100'
              }`}>
                {document.status === 'approved' ? 'This receipt is approved and locked' : 'This receipt is batched'}
              </p>
              <p className={`text-xs mt-0.5 ${
                document.status === 'approved'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-purple-700 dark:text-purple-300'
              }`}>
                {document.status === 'approved'
                  ? 'Only Accountants or Owners can unlock it by changing the status.'
                  : 'Only Accountants or Owners can unbatch it by changing the status.'
                }
              </p>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {document.signed_url ? (
              <>
                {isImage ? (
                  <ImageGallery
                    images={[
                      { url: document.signed_url, name: document.display_name },
                      ...(fullDocument?.child_images?.map(img => ({
                        url: img.signed_url || '',
                        name: img.display_name
                      })) || [])
                    ].filter(img => img.url)}
                    onImageClick={(index) => {
                      setZoomImageIndex(index)
                      setShowZoomModal(true)
                    }}
                  />
                ) : isPDF ? (
                  <PDFInlineViewer
                    signedUrl={document.signed_url}
                    onExpand={() => setShowPdfModal(true)}
                    onDownload={handleDownload}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-600 dark:text-gray-400">
                    <p className="text-sm mb-4">Preview not available for this file type</p>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download File
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-600 dark:text-gray-400">
                <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
                <p className="text-sm font-semibold mb-2">Failed to generate preview URL</p>
                <p className="text-xs mb-4">There may be a connection issue with storage</p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Try Download
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              {isEditing && !isLocked ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{displayName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {document.type === 'receipt' ? 'Category' : 'Type'}
              </label>
              {isEditing && !isLocked ? (
                loadingCategories ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Loading categories...
                  </div>
                ) : types.length === 0 ? (
                  <div className="space-y-2">
                    <div className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      No categories available
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Please ask your account owner to create categories in Settings → Other Settings
                    </p>
                  </div>
                ) : (
                  <select
                    value={document.type === 'receipt' ? category : type}
                    onChange={(e) => document.type === 'receipt' ? setCategory(e.target.value) : setType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  >
                    <option value="">Select a category</option>
                    {types.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                )
              ) : (
                <p className="text-gray-900 dark:text-white">{document.type === 'receipt' ? (category || 'Not specified') : (type || 'Not specified')}</p>
              )}
            </div>

            {isReceiptType && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor
                  </label>
                  {isEditing && !isLocked ? (
                    <VendorAutocomplete
                      value={vendor}
                      onChange={setVendor}
                      vendors={vendors}
                      disabled={loadingVendors}
                      placeholder={loadingVendors ? 'Loading vendors...' : 'Enter vendor name'}
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{vendor || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  {isEditing && !isLocked ? (
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {amount ? `$${parseFloat(amount).toFixed(2)}` : 'Not specified'}
                    </p>
                  )}
                </div>

                {isEditing && !isLocked ? (
                  (entity?.show_billable_default || entity?.show_reimbursable_default) && (
                    <div className="flex items-center gap-3">
                      {entity?.show_billable_default && (
                        <button
                          type="button"
                          onClick={() => setBillable(!billable)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm ${
                            billable
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            billable ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {billable && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          Billable
                        </button>
                      )}
                      {entity?.show_reimbursable_default && (
                        <button
                          type="button"
                          onClick={() => setReimbursable(!reimbursable)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm ${
                            reimbursable
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            reimbursable ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {reimbursable && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          Reimbursable
                        </button>
                      )}
                    </div>
                  )
                ) : (entity?.show_billable_default || entity?.show_reimbursable_default) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expense Options
                    </label>
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-emerald-500/30 bg-gray-50 dark:bg-emerald-500/10">
                      <div className="flex items-center gap-4">
                        {entity?.show_billable_default && (
                          <p className="text-gray-900 dark:text-white font-medium">
                            {billable ? 'Billable' : 'Not Billable'}
                          </p>
                        )}
                        {entity?.show_billable_default && entity?.show_reimbursable_default && (
                          <span className="text-gray-400">/</span>
                        )}
                        {entity?.show_reimbursable_default && (
                          <p className="text-gray-900 dark:text-white font-medium">
                            {reimbursable ? 'Reimbursable' : 'Not Reimbursable'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {entity?.show_create_reports_default && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expense Report
                    </label>
                    {isEditing && !isLocked ? (
                      <input
                        type="text"
                        value={expenseReport}
                        onChange={(e) => setExpenseReport(e.target.value)}
                        placeholder="Enter expense report name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{expenseReport || 'Not specified'}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  {(isEditing || isLocked) && canEditStatus ? (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="flagged">Flagged</option>
                      <option value="batched">Batched</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white capitalize">{status || 'Submitted'}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              {isEditing && !isLocked ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              {isEditing && !isLocked ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              ) : (
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{notes || 'No notes'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              {isEditing && !isLocked ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-emerald-900 dark:hover:text-emerald-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <TagAutocomplete
                      value={tagInput}
                      onChange={setTagInput}
                      onAdd={handleAddTag}
                      tags={entityTags}
                      disabled={loadingTags}
                      placeholder={loadingTags ? 'Loading tags...' : 'Add a tag'}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No tags</p>
                  )}
                </div>
              )}
            </div>

            {isEditing && !isLocked && entity?.upload_multiple_images_default && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <MultipleFileUploadLink
                  parentDocumentId={document.id}
                  onUploadComplete={async () => {
                    const { data: docWithImages } = await getDocumentWithImages(document.id);
                    setFullDocument(docWithImages);
                    showToast('Files uploaded successfully', 'success');
                  }}
                  inheritedMetadata={{
                    tags,
                    vendor,
                    category,
                    type,
                    amount: amount ? parseFloat(amount) : undefined,
                    billable,
                    reimbursable,
                    expenseReport
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Size
                </label>
                <p className="text-gray-900 dark:text-white">{formatFileSize(document.file_size)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Type
                </label>
                <p className="text-gray-900 dark:text-white">{document.mime_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created
                </label>
                <p className="text-gray-900 dark:text-white">{formatDate(document.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document ID
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 dark:text-white font-mono text-sm tracking-wide">
                    #{document.id.slice(-8).toUpperCase()}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`#${document.id.slice(-8).toUpperCase()}`);
                      showToast('Document ID copied', 'success');
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Copy ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {!isEditing && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <button
                  onClick={() => setShowAddTodoModal(true)}
                  className="w-full px-6 py-3 rounded-xl border-2 border-gray-700 dark:border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add To Do
                </button>

                {documentTodos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Related To Dos ({documentTodos.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {documentTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleComplete(todo.id, !todo.is_completed)
                            }}
                            className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                              todo.is_completed
                                ? 'bg-emerald-500 border-emerald-500 hover:bg-emerald-600'
                                : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500'
                            }`}
                          >
                            {todo.is_completed && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span
                            onClick={() => handleTodoClick(todo)}
                            className={`flex-1 text-gray-900 dark:text-white truncate cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${
                              todo.is_completed ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {todo.title || 'Untitled'}
                          </span>
                          {todo.assigned_profiles && todo.assigned_profiles.length > 0 && (
                            <div className="flex-shrink-0">
                              <AvatarStack users={todo.assigned_profiles} maxVisible={2} size="sm" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
          {isLocked && canEditStatus && status !== document.status ? (
            <button
              onClick={handleSaveStatus}
              disabled={saving}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Status'}
            </button>
          ) : isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {showDeleteConfirm ? (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-lg"
                  >
                    Confirm Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                  {(isImage || isPDF) && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={handleAskGrok}
                        disabled={preparingGrokAnalysis || !document.signed_url}
                        className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={pdfConversionStatus === 'converting' ? 'Converting PDF...' : preparingGrokAnalysis ? 'Preparing...' : 'Ask Grok'}
                        aria-label={preparingGrokAnalysis ? 'Preparing Grok analysis' : 'Ask Grok to analyze document'}
                      >
                        {pdfConversionStatus === 'converting' ? (
                          <svg className="w-5 h-5 animate-spin text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <picture>
                            <source media="(prefers-color-scheme: dark)" srcSet="/Grok_Logomark_Light.png" />
                            <img
                              src="/Grok_Logomark_Dark.png"
                              alt="Grok"
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                console.error('Failed to load Grok logo:', e);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </picture>
                        )}
                        {pdfConversionStatus === 'converting' && (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Converting PDF...</span>
                        )}
                      </button>
                      {isPDF && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">Analyzing first page</span>
                          <button
                            disabled
                            title="Multi-page analysis coming soon"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            Analyze all pages
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleDownload}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center"
                    title="Download"
                    aria-label="Download document"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showPdfModal && document?.signed_url && isPDF && (
        <PDFViewerModal
          signedUrl={document.signed_url}
          documentName={document.display_name}
          onClose={() => setShowPdfModal(false)}
          onDownload={handleDownload}
        />
      )}

      {showZoomModal && fullDocument && isImage && (
        <ImageZoomModal
          images={[
            { url: document.signed_url || '', name: document.display_name },
            ...(fullDocument.child_images?.map(img => ({
              url: img.signed_url || '',
              name: img.display_name
            })) || [])
          ].filter(img => img.url)}
          initialIndex={zoomImageIndex}
          onClose={() => setShowZoomModal(false)}
        />
      )}

      {showAddTodoModal && document && (
        <AddTodoModal
          document={{
            id: document.id,
            display_name: document.display_name,
            type: document.type,
            signed_url: document.signed_url,
            mime_type: document.mime_type,
          }}
          isOpen={showAddTodoModal}
          onClose={() => setShowAddTodoModal(false)}
          onSuccess={() => {
            loadDocumentTodos()
          }}
        />
      )}

      {showTodoDetailModal && selectedTodo && (
        <TodoDetailModal
          todo={selectedTodo}
          isOpen={showTodoDetailModal}
          onClose={handleTodoDetailClose}
          onToggleComplete={handleToggleComplete}
          onToggleBookmark={async (todoId: string, bookmark: boolean) => {
            try {
              const { error } = await toggleTodoBookmark(todoId, bookmark)
              if (error) {
                showToast('Failed to update bookmark', 'error')
              } else {
                showToast(bookmark ? 'Todo bookmarked' : 'Bookmark removed', 'success')
                loadDocumentTodos()
              }
            } catch (error) {
              console.error('Failed to toggle bookmark:', error)
              showToast('Failed to update bookmark', 'error')
            }
          }}
          onUpdate={handleTodoUpdate}
        />
      )}
    </div>
  )
}
