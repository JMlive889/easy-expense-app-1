import React, { useState, useMemo, useEffect } from 'react'
import { toggleTodoComplete, toggleTodoBookmark, markMessageRead, Todo } from '../lib/todos'
import { TodoListItem } from '../components/todos/TodoListItem'
import { TodoDetailModal } from '../components/todos/TodoDetailModal'
import { AppHeader } from '../components/AppHeader'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { PageType } from '../App'
import { useInboxMessages, useSentMessages } from '../hooks/useMessages'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageListItemSkeleton } from '../components/ui/Skeleton'
import { ComposeMessageModal } from '../components/messages/ComposeMessageModal'
import { MessageTypeDropdown } from '../components/messages/MessageTypeDropdown'
import { LoadMoreButton } from '../components/ui/LoadMoreButton'
import { Plus, Eye, EyeOff } from 'lucide-react'

const MESSAGES_PAGE_SIZE = 10

interface MessagesProps {
  onNavigate: (page: PageType) => void
  onBack: () => void
  onNavigateToChat: (messageId: string) => void
}

export default function Messages({ onNavigate, onBack, onNavigateToChat }: MessagesProps) {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'all'>('inbox')
  const [filter, setFilter] = useState<'all' | 'unread' | 'bookmarked'>('all')
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false)
  const [hideCompleted, setHideCompleted] = useState(true)
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PAGE_SIZE)
  const [selectedMessage, setSelectedMessage] = useState<Todo | null>(null)
  const [showMessageDetailModal, setShowMessageDetailModal] = useState(false)
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const { data: inboxMessages = [], isLoading: isLoadingInbox } = useInboxMessages()
  const { data: sentMessages = [], isLoading: isLoadingSent } = useSentMessages()

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ todoId, isCompleted }: { todoId: string; isCompleted: boolean }) => {
      const { error } = await toggleTodoComplete(todoId, isCompleted)
      if (error) throw error
    },
    onSuccess: (_, { isCompleted }) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      showToast(isCompleted ? 'Marked as complete' : 'Marked as incomplete', 'success')
    },
    onError: () => {
      showToast('Failed to update message', 'error')
    },
  })

  const toggleBookmarkMutation = useMutation({
    mutationFn: async ({ todoId, bookmark }: { todoId: string; bookmark: boolean }) => {
      const { error } = await toggleTodoBookmark(todoId, bookmark)
      if (error) throw error
    },
    onSuccess: (_, { bookmark }) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      showToast(bookmark ? 'Bookmarked' : 'Removed bookmark', 'success')
    },
    onError: () => {
      showToast('Failed to bookmark message', 'error')
    },
  })

  const messages = useMemo(() => {
    if (activeTab === 'inbox') {
      return inboxMessages
    } else if (activeTab === 'sent') {
      return sentMessages
    } else {
      const combined = [...inboxMessages, ...sentMessages]
      const unique = Array.from(new Map(combined.map(m => [m.id, m])).values())
      return unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }, [activeTab, inboxMessages, sentMessages])

  const isLoading = useMemo(() => {
    if (activeTab === 'inbox') return isLoadingInbox
    if (activeTab === 'sent') return isLoadingSent
    return isLoadingInbox || isLoadingSent
  }, [activeTab, isLoadingInbox, isLoadingSent])

  const handleToggleComplete = (todoId: string, isCompleted: boolean) => {
    toggleCompleteMutation.mutate({ todoId, isCompleted })
  }

  const handleToggleBookmark = (todoId: string, bookmark: boolean) => {
    toggleBookmarkMutation.mutate({ todoId, bookmark })
  }

  const handleMessageClick = async (message: Todo) => {
    await markMessageRead(message.id)
    setSelectedMessage(message)
    setShowMessageDetailModal(true)
  }

  const handleDocumentUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['messages'] })
  }

  const handleComposeSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['messages'] })
  }

  const handleMessageDetailClose = () => {
    setShowMessageDetailModal(false)
    setSelectedMessage(null)
  }

  const handleMessageUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['messages'] })
  }

  const filteredMessages = useMemo(() => {
    let filtered = messages.filter(message => {
      if (filter === 'unread') {
        return message.assigned_users?.length > 0 && !message.read_by?.includes(message.created_by)
      }
      if (filter === 'bookmarked') {
        return message.bookmark
      }
      return true
    })

    if (hideCompleted) {
      filtered = filtered.filter(m => !m.is_completed)
    }

    if (filter === 'all') {
      const incomplete = filtered
        .filter(m => !m.is_completed)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const completed = filtered
        .filter(m => m.is_completed)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return [...incomplete, ...completed]
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [messages, filter, hideCompleted])

  const handleToggleHideCompleted = () => {
    const newValue = !hideCompleted
    setHideCompleted(newValue)
    showToast(
      newValue ? 'Completed Messages Hidden' : 'Completed Messages Visible',
      'success',
      5000
    )
  }

  useEffect(() => {
    setVisibleCount(MESSAGES_PAGE_SIZE)
  }, [activeTab, filter, hideCompleted])

  const visibleMessages = useMemo(() => filteredMessages.slice(0, visibleCount), [filteredMessages, visibleCount])

  const showSkeleton = isLoading && messages.length === 0

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="Messages"
        currentPage="messages"
        onNavigate={onNavigate}
        onBack={onBack}
        headerVisible={profile?.header_visible ?? true}
      />
      <div className="max-w-4xl mx-auto p-6 pb-8 lg:pb-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <MessageTypeDropdown
              value={activeTab}
              onChange={setActiveTab}
            />

            <button
              onClick={handleToggleHideCompleted}
              className={`p-2 rounded-lg transition-colors ${
                hideCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              } hover:bg-emerald-50 dark:hover:bg-emerald-900/20`}
              aria-label={hideCompleted ? 'Show completed messages' : 'Hide completed messages'}
              title={hideCompleted ? 'Show completed messages' : 'Hide completed messages'}
            >
              {hideCompleted ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-gray-800 dark:bg-gray-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-gray-800 dark:bg-gray-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('bookmarked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'bookmarked'
                  ? 'bg-gray-800 dark:bg-gray-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Bookmarked
            </button>
          </div>
        </div>

        {showSkeleton ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <MessageListItemSkeleton key={i} />
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No messages yet' : `No ${filter} messages`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMessages.map((message) => (
              <TodoListItem
                key={message.id}
                todo={message}
                onToggleComplete={handleToggleComplete}
                onToggleBookmark={handleToggleBookmark}
                onClick={handleMessageClick}
                onDocumentUpdate={handleDocumentUpdate}
              />
            ))}
            <LoadMoreButton
              visibleCount={visibleCount}
              totalCount={filteredMessages.length}
              onLoadMore={() => setVisibleCount(c => c + MESSAGES_PAGE_SIZE)}
              label="messages"
              increment={MESSAGES_PAGE_SIZE}
            />
          </div>
        )}
      </div>

      <button
        onClick={() => setIsComposeModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        aria-label="Compose new message"
      >
        <Plus className="w-6 h-6" />
      </button>

      <ComposeMessageModal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        onSuccess={handleComposeSuccess}
      />

      {showMessageDetailModal && selectedMessage && (
        <TodoDetailModal
          todo={selectedMessage}
          isOpen={showMessageDetailModal}
          onClose={handleMessageDetailClose}
          onToggleComplete={handleToggleComplete}
          onToggleBookmark={handleToggleBookmark}
          onUpdate={handleMessageUpdate}
        />
      )}
    </div>
  )
}
