import React, { useState } from 'react'
import { X } from 'lucide-react'
import { createTodo } from '../../lib/todos'
import { UserPicker } from './UserPicker'
import { useToast } from '../../contexts/ToastContext'

interface User {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

interface Document {
  id: string
  display_name: string
  type: string | null
  signed_url: string | null
  mime_type?: string
}

interface AddTodoModalProps {
  document: Document
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddTodoModal({ document, isOpen, onClose, onSuccess }: AddTodoModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      showToast('Please enter a description', 'error')
      return
    }

    setSaving(true)
    try {
      const category = determineCategory(document.type)
      const { data, error } = await createTodo({
        title: title.trim() || undefined,
        content: content.trim(),
        category,
        documentId: document.id,
        assignedUsers: selectedUsers.map((u) => u.id),
        type: document.type || undefined,
      })

      if (error) throw error

      showToast('To do created successfully', 'success')
      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Failed to create todo:', error)
      showToast(error instanceof Error ? error.message : 'Failed to create to do', 'error')
    } finally {
      setSaving(false)
    }
  }

  const determineCategory = (type: string | null): 'general' | 'docs' | 'messages' | 'receipts' => {
    const receiptTypes = ['receipt', 'meal', 'travel', 'office-supplies', 'equipment', 'utilities']
    if (type && receiptTypes.includes(type)) {
      return 'receipts'
    }
    return 'docs'
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setSelectedUsers([])
    onClose()
  }

  if (!isOpen) return null

  const isImage = document.mime_type?.startsWith('image/')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add To Do</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              {isImage && document.signed_url ? (
                <img
                  src={document.signed_url}
                  alt={document.display_name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-2xl text-white">📄</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {document.display_name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {document.type || 'Document'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this to do"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What needs to be done?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign Users
            </label>
            <UserPicker
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
              disabled={saving}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Adding users will create a message thread for collaboration
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {saving ? 'Creating...' : 'Create To Do'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
