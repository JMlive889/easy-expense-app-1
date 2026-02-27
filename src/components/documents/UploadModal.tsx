import React, { useState, useEffect } from 'react'
import { X, Upload, Bookmark, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { FilePreview } from './FilePreview'
import { VendorAutocomplete } from './VendorAutocomplete'
import { TagAutocomplete } from './TagAutocomplete'
import { UserPicker } from '../todos/UserPicker'
import { uploadDocument, getEntityVendors, getEntityTags } from '../../lib/documents'
import { createTodo } from '../../lib/todos'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { getCategories, Category } from '../../lib/categories'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
  pageType: 'documents' | 'receipts'
  preSelectedFiles?: File[]
}

export function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  pageType,
  preSelectedFiles = []
}: UploadModalProps) {
  const [files, setFiles] = useState<File[]>(preSelectedFiles)
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({})
  const [displayName, setDisplayName] = useState('')
  const [type, setType] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0])
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [billable, setBillable] = useState(false)
  const [reimbursable, setReimbursable] = useState(false)
  const [expenseReport, setExpenseReport] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [vendors, setVendors] = useState<string[]>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [entityTags, setEntityTags] = useState<string[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [createTodoEnabled, setCreateTodoEnabled] = useState(false)
  const [todoTitle, setTodoTitle] = useState('')
  const [todoDescription, setTodoDescription] = useState('')
  const [todoAssignedUsers, setTodoAssignedUsers] = useState<Array<{ id: string; full_name: string | null; email: string | null; avatar_url: string | null }>>([])
  const { showToast } = useToast()
  const { profile, entity } = useAuth()

  useEffect(() => {
    if (preSelectedFiles.length > 0) {
      setFiles(preSelectedFiles)
      generatePreviews(preSelectedFiles)
    }
  }, [preSelectedFiles])

  useEffect(() => {
    if (isOpen && profile?.current_entity_id) {
      loadCategories()
      loadTags()
      if (pageType === 'receipts') {
        loadVendors()
        setBillable(entity?.show_billable_default || false)
        setReimbursable(entity?.show_reimbursable_default || false)
      }
    }
  }, [isOpen, profile?.current_entity_id, pageType])

  const loadCategories = async () => {
    if (!profile?.current_entity_id) return

    setLoadingCategories(true)
    try {
      const categoryType = pageType === 'receipts' ? 'receipt' : 'document'
      const fetchedCategories = await getCategories(profile.current_entity_id, categoryType, false)
      setCategories(fetchedCategories)
    } catch (error) {
      console.error('Failed to load categories:', error)
      showToast('Failed to load categories', 'error')
    } finally {
      setLoadingCategories(false)
    }
  }

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

  const loadTags = async () => {
    if (!profile?.current_entity_id) return

    setLoadingTags(true)
    try {
      const { data, error } = await getEntityTags(profile.entity_id)
      if (error) throw error
      setEntityTags(data || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setLoadingTags(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const generatePreviews = (fileList: File[]) => {
    fileList.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreviews(prev => ({
            ...prev,
            [file.name]: reader.result as string
          }))
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const resetForm = () => {
    setFiles([])
    setFilePreviews({})
    setDisplayName('')
    setType('')
    setNotes('')
    setTags([])
    setTagInput('')
    setDueDate(new Date().toISOString().split('T')[0])
    setVendor('')
    setAmount('')
    setBookmarked(false)
    setBillable(false)
    setReimbursable(false)
    setExpenseReport('')
    setUploading(false)
    setUploadProgress(0)
    setCreateTodoEnabled(false)
    setTodoTitle('')
    setTodoDescription('')
    setTodoAssignedUsers([])
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)

    const removedFile = files[index]
    if (filePreviews[removedFile.name]) {
      const newPreviews = { ...filePreviews }
      delete newPreviews[removedFile.name]
      setFilePreviews(newPreviews)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      showToast('Please select at least one file', 'error')
      return
    }

    if (!displayName.trim()) {
      showToast('Please enter a display name', 'error')
      return
    }

    if (!type) {
      showToast('Please select a document type', 'error')
      return
    }

    if (createTodoEnabled && !todoDescription.trim()) {
      showToast('Please enter a description for the to-do', 'error')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const allImages = files.every(file => file.type.startsWith('image/'))
      const shouldCreateGallery = allImages && files.length > 1
      let firstDocumentId: string | undefined

      if (shouldCreateGallery) {
        let parentDocumentId: string | undefined

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          const { data } = await uploadDocument({
            file,
            displayName,
            type: pageType === 'receipts' ? 'receipt' : 'document',
            category: type,
            notes: notes.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
            dueDate: dueDate || undefined,
            vendor: vendor.trim() || undefined,
            amount: amount ? parseFloat(amount) : undefined,
            bookmarked,
            billable,
            reimbursable,
            expenseReport: expenseReport.trim() || undefined,
            parentDocumentId: i === 0 ? undefined : parentDocumentId,
            displayOrder: i
          })

          if (i === 0 && data) {
            parentDocumentId = data.id
            firstDocumentId = data.id
          }

          setUploadProgress(Math.round(((i + 1) / files.length) * 100))
        }

        showToast(`Successfully uploaded ${files.length} images as a gallery`, 'success')
      } else {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          const { data } = await uploadDocument({
            file,
            displayName: files.length > 1 ? `${displayName} (${i + 1})` : displayName,
            type: pageType === 'receipts' ? 'receipt' : 'document',
            category: type,
            notes: notes.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
            dueDate: dueDate || undefined,
            vendor: vendor.trim() || undefined,
            amount: amount ? parseFloat(amount) : undefined,
            bookmarked,
            billable,
            reimbursable,
            expenseReport: expenseReport.trim() || undefined
          })

          if (i === 0 && data) {
            firstDocumentId = data.id
          }

          setUploadProgress(Math.round(((i + 1) / files.length) * 100))
        }

        showToast(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`, 'success')
      }

      if (createTodoEnabled && firstDocumentId && todoDescription.trim()) {
        const todoCategory = pageType === 'receipts' ? 'receipts' : 'docs'
        const { error: todoError } = await createTodo({
          title: todoTitle.trim() || undefined,
          content: todoDescription.trim(),
          category: todoCategory,
          documentId: firstDocumentId,
          assignedUsers: todoAssignedUsers.map(u => u.id)
        })

        if (todoError) {
          showToast('Document uploaded, but failed to create to-do', 'error')
        } else {
          showToast('Document and to-do created successfully', 'success')
        }
      }

      onUploadComplete()
      onClose()
    } catch (error) {
      console.error('Upload error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to upload files', 'error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const types = categories.map(cat => ({ value: cat.name, label: cat.name }))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm touch-none overscroll-none">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload {pageType === 'receipts' ? 'Receipt' : 'Document'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateTodoEnabled(!createTodoEnabled)}
              disabled={uploading}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors font-medium text-sm ${
                createTodoEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add To Do</span>
            </button>
            <button
              type="button"
              onClick={() => setBookmarked(!bookmarked)}
              disabled={uploading}
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
              onClick={onClose}
              disabled={uploading}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {files.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <FilePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    previewUrl={filePreviews[file.name]}
                    onRemove={() => handleRemoveFile(index)}
                  />
                ))}
              </div>

              {files.length > 1 && files.every(file => file.type.startsWith('image/')) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Multiple images detected. These will be uploaded as a gallery with the first image as the main view.
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter a name for this document"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            {loadingCategories ? (
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
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={uploading}
              >
                <option value="">Select a category</option>
                {types.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
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
                    disabled={uploading}
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
                disabled={uploading || loadingTags}
                placeholder={loadingTags ? 'Loading tags...' : 'Add a tag'}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={uploading}
                className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {pageType === 'receipts' && (
            <>
              {(entity?.show_billable_default || entity?.show_reimbursable_default) && (
                <div className="flex items-center gap-3">
                  {entity?.show_billable_default && (
                    <button
                      type="button"
                      onClick={() => setBillable(!billable)}
                      disabled={uploading}
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
                      disabled={uploading}
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
              )}

              {entity?.show_create_reports_default && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expense Report
                  </label>
                  <input
                    type="text"
                    value={expenseReport}
                    onChange={(e) => setExpenseReport(e.target.value)}
                    placeholder="Enter expense report name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={uploading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vendor
                </label>
                <VendorAutocomplete
                  value={vendor}
                  onChange={setVendor}
                  vendors={vendors}
                  disabled={uploading || loadingVendors}
                  placeholder={loadingVendors ? 'Loading vendors...' : 'Enter vendor name'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled={uploading}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={uploading}
            />
          </div>

          {createTodoEnabled && (
            <div className="border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-4 bg-emerald-50/50 dark:bg-emerald-900/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  To-Do Details
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Will be created on upload
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  placeholder="Enter to-do title"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={todoDescription}
                  onChange={(e) => setTodoDescription(e.target.value)}
                  placeholder="What needs to be done?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  disabled={uploading}
                  required={createTodoEnabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign To
                </label>
                <UserPicker
                  selectedUsers={todoAssignedUsers}
                  onSelectionChange={setTodoAssignedUsers}
                  disabled={uploading}
                />
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
