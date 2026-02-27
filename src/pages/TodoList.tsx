import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { getTodosByCategory, toggleTodoComplete, toggleTodoBookmark, Todo } from '../lib/todos'
import { TodoListItem } from '../components/todos/TodoListItem'
import { AppHeader } from '../components/AppHeader'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { PageType } from '../App'

interface TodoListProps {
  onNavigate: (page: PageType) => void
  onBack: () => void
  onNavigateToTodo: (todoId: string) => void
}

export default function TodoList({ onNavigate, onBack, onNavigateToTodo }: TodoListProps) {
  const { profile } = useAuth()
  const [activeCategory, setActiveCategory] = useState<'general' | 'docs' | 'receipts' | 'messages'>('general')
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'bookmarked' | 'completed'>('all')
  const { showToast } = useToast()

  useEffect(() => {
    loadTodos()
  }, [activeCategory])

  const loadTodos = async () => {
    setLoading(true)
    try {
      const { data, error } = await getTodosByCategory(activeCategory, filter === 'completed')
      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('Failed to load todos:', error)
      showToast('Failed to load to dos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (todoId: string, isCompleted: boolean) => {
    try {
      const { error } = await toggleTodoComplete(todoId, isCompleted)
      if (error) throw error
      loadTodos()
      showToast(isCompleted ? 'Marked as complete' : 'Marked as incomplete', 'success')
    } catch (error) {
      showToast('Failed to update to do', 'error')
    }
  }

  const handleToggleBookmark = async (todoId: string, bookmark: boolean) => {
    try {
      const { error } = await toggleTodoBookmark(todoId, bookmark)
      if (error) throw error
      loadTodos()
      showToast(bookmark ? 'Bookmarked' : 'Removed bookmark', 'success')
    } catch (error) {
      showToast('Failed to bookmark to do', 'error')
    }
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'bookmarked') {
      return todo.bookmark
    }
    if (filter === 'completed') {
      return todo.is_completed
    }
    return !todo.is_completed
  })

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader
        pageTitle="To Do List"
        currentPage="todos"
        onNavigate={onNavigate}
        onBack={onBack}
        headerVisible={profile?.header_visible ?? true}
      />
      <div className="max-w-4xl mx-auto p-6 pb-8 lg:pb-8">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Track tasks and action items for your documents and receipts
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
            <button
              onClick={() => setActiveCategory('general')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'general'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveCategory('docs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'docs'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveCategory('receipts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'receipts'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Receipts
            </button>
            <button
              onClick={() => setActiveCategory('messages')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'messages'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Messages
            </button>
          </div>

          <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('bookmarked')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === 'bookmarked'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Bookmarked
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No active to dos' : `No ${filter} to dos`}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Create a to do from a document or receipt to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTodos.map((todo) => (
              <TodoListItem
                key={todo.id}
                todo={todo}
                onToggleComplete={handleToggleComplete}
                onToggleBookmark={handleToggleBookmark}
                onClick={onNavigateToTodo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
