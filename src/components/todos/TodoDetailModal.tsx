import React, { useState, useEffect } from 'react'
import { X, Check, Bookmark, FileText, Receipt, MessageCircle, Calendar, User, Trash2, Edit2, Save } from 'lucide-react'
import { Todo, updateTodo } from '../../lib/todos'
import { getDocumentWithImages, Document } from '../../lib/documents'
import { DocumentDetailModal } from '../documents/DocumentDetailModal'
import { useToast } from '../../contexts/ToastContext'
import { AvatarStack } from '../ui/AvatarStack'
import { UserPicker } from './UserPicker'

interface User {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

interface TodoDetailModalProps {
  todo: Todo
  isOpen: boolean
  onClose: () => void
  onToggleComplete?: (todoId: string, isCompleted: boolean) => void
  onToggleBookmark?: (todoId: string, bookmark: boolean) => void
  onDelete?: (todoId: string) => void
  onUpdate?: () => void
}

export function TodoDetailModal({
  todo,
  isOpen,
  onClose,
  onToggleComplete,
  onToggleBookmark,
  onDelete,
  onUpdate,
}: TodoDetailModalProps) {
  const { showToast } = useToast()
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [fullDocument, setFullDocument] = useState<Document | null>(null)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editAssignedUsers, setEditAssignedUsers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getTypeIcon = () => {
    if (todo.type === 'receipt' || todo.category === 'receipts') {
      return <Receipt className="w-5 h-5" />
    }
    if (todo.category === 'docs') {
      return <FileText className="w-5 h-5" />
    }
    return <MessageCircle className="w-5 h-5" />
  }

  const getTypeBadge = () => {
    if (todo.type === 'receipt' || todo.category === 'receipts') {
      return 'Receipt'
    }
    if (todo.category === 'docs') {
      return 'Document'
    }
    return 'Message'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const loadAndShowDocument = async () => {
    if (!todo.document?.id) return

    setIsLoadingDocument(true)
    try {
      const { data, error } = await getDocumentWithImages(todo.document.id)

      if (error) {
        showToast('Failed to load document', 'error')
        return
      }

      if (!data) {
        showToast('Document not found', 'error')
        return
      }

      setFullDocument(data)
      setShowDocumentModal(true)
    } catch (error) {
      console.error('Error loading document:', error)
      showToast('Failed to load document', 'error')
    } finally {
      setIsLoadingDocument(false)
    }
  }

  const handleDocumentModalClose = () => {
    setShowDocumentModal(false)
    setFullDocument(null)
  }

  const handleDocumentUpdate = () => {
    if (onUpdate) {
      onUpdate()
    }
  }

  const handleDocumentDelete = () => {
    setShowDocumentModal(false)
    setFullDocument(null)
    if (onUpdate) {
      onUpdate()
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(todo.id)
      showToast('Todo deleted', 'success')
      onClose()
    } catch (error) {
      showToast('Failed to delete todo', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleEdit = () => {
    setEditTitle(todo.title || '')
    setEditContent(todo.content)
    setEditAssignedUsers(todo.assigned_profiles || [])
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle('')
    setEditContent('')
    setEditAssignedUsers([])
  }

  const handleSave = async () => {
    if (!editContent.trim()) {
      showToast('Description cannot be empty', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await updateTodo(todo.id, {
        title: editTitle.trim() || undefined,
        content: editContent.trim(),
        assignedUsers: editAssignedUsers.map((u) => u.id),
      })

      if (error) throw error

      showToast('Todo updated successfully', 'success')
      setIsEditing(false)
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to update todo:', error)
      showToast('Failed to update todo', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getTypeIcon()}
                  <span>{getTypeBadge()}</span>
                </span>
                {todo.is_completed && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <Check className="w-4 h-4" />
                    Completed
                  </span>
                )}
                {isEditing && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-medium text-blue-700 dark:text-blue-400">
                    <Edit2 className="w-4 h-4" />
                    Editing
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none pb-1"
                  autoFocus
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todo.title || 'Untitled'}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  title="Edit todo"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-shrink-0 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                  title="Save changes"
                >
                  <Save className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={isEditing ? handleCancelEdit : onClose}
                className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isEditing ? 'Cancel editing' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter description..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              ) : (
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {todo.content}
                </p>
              )}
            </div>

            {/* Associated Document */}
            {todo.document?.display_name && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Associated Document</h3>
                <button
                  onClick={loadAndShowDocument}
                  disabled={isLoadingDocument || isEditing}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {isLoadingDocument ? 'Loading...' : todo.document.display_name}
                  </span>
                </button>
              </div>
            )}

            {/* Assigned Users */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigned To</h3>
              {isEditing ? (
                <UserPicker
                  selectedUsers={editAssignedUsers}
                  onSelectionChange={setEditAssignedUsers}
                  disabled={saving}
                />
              ) : todo.assigned_profiles && todo.assigned_profiles.length > 0 ? (
                <div className="flex items-center gap-3">
                  <AvatarStack users={todo.assigned_profiles} maxVisible={5} size="md" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {todo.assigned_profiles.map((p) => p.full_name).join(', ')}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Not assigned to anyone
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(todo.created_at)}</span>
              </div>
              {todo.reply_count !== undefined && todo.reply_count > 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <MessageCircle className="w-4 h-4" />
                  <span>{todo.reply_count} {todo.reply_count === 1 ? 'reply' : 'replies'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {onToggleComplete && (
                    <button
                      onClick={() => {
                        onToggleComplete(todo.id, !todo.is_completed)
                        onClose()
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        todo.is_completed
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {todo.is_completed ? 'Mark Incomplete' : 'Complete'}
                    </button>
                  )}
                  {onToggleBookmark && (
                    <button
                      onClick={() => {
                        onToggleBookmark(todo.id, !todo.bookmark)
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        todo.bookmark
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      title={todo.bookmark ? 'Remove bookmark' : 'Bookmark'}
                    >
                      <Bookmark className={`w-5 h-5 ${todo.bookmark ? 'fill-current' : ''}`} />
                    </button>
                  )}
                  {onDelete && !showDeleteConfirm && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete todo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  {showDeleteConfirm && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showDocumentModal && fullDocument && (
        <DocumentDetailModal
          document={fullDocument}
          isOpen={showDocumentModal}
          onClose={handleDocumentModalClose}
          onUpdate={handleDocumentUpdate}
          onDelete={handleDocumentDelete}
        />
      )}
    </>
  )
}
