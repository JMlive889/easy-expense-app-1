import React, { useState } from 'react'
import { Check, Bookmark, FileText, Receipt, MessageCircle } from 'lucide-react'
import { Todo } from '../../lib/todos'
import { AvatarStack } from '../ui/AvatarStack'
import { useAuth } from '../../contexts/AuthContext'
import { DocumentDetailModal } from '../documents/DocumentDetailModal'
import { getDocumentWithImages, Document } from '../../lib/documents'
import { useToast } from '../../contexts/ToastContext'
import { useDeleteDocument } from '../../hooks/useDocuments'

interface TodoListItemProps {
  todo: Todo
  onToggleComplete: (todoId: string, isCompleted: boolean) => void
  onToggleBookmark: (todoId: string, bookmark: boolean) => void
  onClick: (todo: Todo) => void
  onDocumentUpdate?: () => void
}

export function TodoListItem({
  todo,
  onToggleComplete,
  onToggleBookmark,
  onClick,
  onDocumentUpdate,
}: TodoListItemProps) {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const deleteDocument = useDeleteDocument()
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [fullDocument, setFullDocument] = useState<Document | null>(null)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)

  const isUnread = todo.assigned_users?.includes(profile?.id || '') &&
                   !todo.read_by?.includes(profile?.id || '')

  const getTypeIcon = () => {
    if (todo.type === 'receipt' || todo.category === 'receipts') {
      return <Receipt className="w-4 h-4" />
    }
    if (todo.category === 'docs') {
      return <FileText className="w-4 h-4" />
    }
    return <MessageCircle className="w-4 h-4" />
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
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleTitleClick = async (e: React.MouseEvent) => {
    if (todo.document) {
      e.stopPropagation()
      await loadAndShowDocument()
    } else {
      onClick(todo)
    }
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
    if (onDocumentUpdate) {
      onDocumentUpdate()
    }
  }

  const handleDocumentDelete = () => {
    setShowDocumentModal(false)
    setFullDocument(null)
    if (onDocumentUpdate) {
      onDocumentUpdate()
    }
  }

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isUnread
          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(todo.id, !todo.is_completed)
          }}
          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            todo.is_completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500'
          }`}
        >
          {todo.is_completed && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3
                onClick={handleTitleClick}
                className={`text-base font-semibold cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${
                  todo.is_completed
                    ? 'text-gray-400 dark:text-gray-600 line-through'
                    : 'text-gray-900 dark:text-white'
                } ${isUnread ? 'font-bold' : ''}`}
              >
                {todo.title || 'Untitled'}
              </h3>
              {todo.content && (
                <p
                  className={`text-sm mt-1 line-clamp-2 ${
                    todo.is_completed
                      ? 'text-gray-400 dark:text-gray-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {todo.content}
                </p>
              )}
            </div>

            {todo.assigned_profiles && todo.assigned_profiles.length > 0 && (
              <div className="flex-shrink-0">
                <AvatarStack users={todo.assigned_profiles} maxVisible={3} size="sm" />
              </div>
            )}
          </div>

          {todo.document?.display_name && (
            <p
              onClick={(e) => {
                e.stopPropagation()
                loadAndShowDocument()
              }}
              className={`text-sm mt-2 cursor-pointer transition-colors ${
                todo.is_completed
                  ? 'text-gray-400 dark:text-gray-600'
                  : isLoadingDocument
                  ? 'text-gray-400 dark:text-gray-600 cursor-wait'
                  : 'text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
              title={todo.document.display_name}
            >
              {isLoadingDocument ? 'Loading...' : todo.document.display_name}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
              {getTypeIcon()}
              <span>{getTypeBadge()}</span>
            </span>
            <span>{formatDate(todo.created_at)}</span>
            {todo.reply_count !== undefined && todo.reply_count > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {todo.reply_count} {todo.reply_count === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleBookmark(todo.id, !todo.bookmark)
          }}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            todo.bookmark
              ? 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
              : 'text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${todo.bookmark ? 'fill-current' : ''}`}
          />
        </button>
      </div>

      {isUnread && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500"></div>
      )}

      {showDocumentModal && fullDocument && (
        <DocumentDetailModal
          document={fullDocument}
          isOpen={showDocumentModal}
          onClose={handleDocumentModalClose}
          onUpdate={handleDocumentUpdate}
          onDelete={handleDocumentDelete}
          deleteMutation={deleteDocument}
        />
      )}
    </div>
  )
}
