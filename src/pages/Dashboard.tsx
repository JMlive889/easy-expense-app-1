import React, { useState, useEffect } from 'react'
import { AuthGuard } from '../components/auth/AuthGuard'
import { useAuth } from '../contexts/AuthContext'
import { TaskCategory } from '../contexts/TaskContext'
import HamburgerMenu from '../components/HamburgerMenu'
import { AppHeader } from '../components/AppHeader'
import { PageType } from '../App'
import { Mail, Bookmark, Receipt, FileText, ChevronRight, List, Lock, Unlock } from 'lucide-react'
import TaskList from '../components/tasks/TaskList'
import CreateTaskModal from '../components/tasks/CreateTaskModal'
import ViewAllModal from '../components/tasks/ViewAllModal'
import { UploadModal } from '../components/documents/UploadModal'
import { UploadButton } from '../components/documents/UploadButton'
import { getTodosByCategory, toggleTodoComplete, toggleTodoBookmark, deleteTodo, Todo } from '../lib/todos'
import { useToast } from '../contexts/ToastContext'
import type { Task } from '../contexts/TaskContext'
import { useTheme } from '../contexts/ThemeContext'
import { updateHeaderVisibility } from '../lib/profiles'
import { TodoDetailModal } from '../components/todos/TodoDetailModal'

interface DashboardProps {
  onNavigate: (page: PageType) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user, profile, entity, updateProfile } = useAuth()
  const { theme } = useTheme()
  const { showToast } = useToast()
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('docs')
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [updatingHeader, setUpdatingHeader] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [showTodoModal, setShowTodoModal] = useState(false)

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const entityName = entity?.entity_name || 'My Business'
  const headerVisible = profile?.header_visible ?? true

  // Load todos for all categories
  const loadTodos = async () => {
    if (!user || !profile) {
      return
    }
    setLoading(true)
    const { data, error } = await getTodosByCategory(undefined, false)
    if (error) {
      console.error('Error loading todos:', error)
      showToast('Failed to load todos', 'error')
    } else {
      setTodos(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user && profile) {
      loadTodos()
    }
  }, [user, profile])

  // Refresh todos when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && profile) {
        loadTodos()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, profile])

  // Convert Todo to Task format for compatibility with TaskList
  const convertTodoToTask = (todo: Todo): Task => ({
    id: todo.id,
    content: todo.title || todo.content,
    category: todo.category,
    is_completed: todo.is_completed,
    entity_id: todo.entity_id,
    created_by: todo.created_by,
    created_at: todo.created_at,
    updated_at: todo.updated_at,
    completed_at: todo.completed_at,
    assigned_profiles: todo.assigned_profiles,
  })

  const getTasksByCategory = (category: TaskCategory): Task[] => {
    return todos
      .filter(todo => todo.category === category && !todo.is_completed)
      .map(convertTodoToTask)
  }

  const getTaskCount = (category: TaskCategory): number => {
    return todos.filter(todo => todo.category === category && !todo.is_completed).length
  }

  const handleToggleComplete = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    const { error } = await toggleTodoComplete(id, !todo.is_completed)
    if (error) {
      showToast('Failed to update todo', 'error')
    } else {
      loadTodos()
    }
  }

  const handleDeleteTask = async (id: string) => {
    const { error } = await deleteTodo(id)
    if (error) {
      showToast('Failed to delete todo', 'error')
    } else {
      showToast('Todo deleted', 'success')
      loadTodos()
    }
  }

  const handleTodoClick = (taskId: string) => {
    const todo = todos.find(t => t.id === taskId)
    if (todo) {
      setSelectedTodo(todo)
      setShowTodoModal(true)
    }
  }

  const handleToggleBookmark = async (todoId: string, bookmark: boolean) => {
    try {
      const { error } = await toggleTodoBookmark(todoId, bookmark)
      if (error) throw error
      loadTodos()
      showToast(bookmark ? 'Bookmarked' : 'Removed bookmark', 'success')
      // Update the selected todo if it's open
      if (selectedTodo?.id === todoId) {
        setSelectedTodo({ ...selectedTodo, bookmark })
      }
    } catch (error) {
      showToast('Failed to bookmark todo', 'error')
    }
  }

  const handleTodoModalClose = () => {
    setShowTodoModal(false)
    setSelectedTodo(null)
  }

  const handleFileSelected = (file: File) => {
    setSelectedFiles([file])
    setShowUploadModal(true)
  }

  const handleUploadComplete = () => {
    setShowUploadModal(false)
    setSelectedFiles([])
    onNavigate('receipts')
  }

  const handleToggleHeader = async () => {
    if (!user || updatingHeader) return

    const newVisibility = !headerVisible
    setUpdatingHeader(true)

    try {
      await updateHeaderVisibility(user.id, newVisibility)
      await updateProfile({ header_visible: newVisibility })
      showToast(newVisibility ? 'Header unlocked' : 'Header locked', 'success')
    } catch (error) {
      console.error('Failed to update header visibility:', error)
      showToast('Failed to update preference', 'error')
    } finally {
      setUpdatingHeader(false)
    }
  }

  const features = [
    { name: 'Messages', icon: Mail, colorLight: 'text-emerald-600', colorDark: 'text-emerald-400' },
    { name: 'Bookmarks', icon: Bookmark, colorLight: 'text-teal-500', colorDark: 'text-teal-400' },
    { name: 'Receipts', icon: Receipt, colorLight: 'text-emerald-500', colorDark: 'text-emerald-300' },
    { name: 'Documents', icon: FileText, colorLight: 'text-slate-400', colorDark: 'text-slate-300' },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <AppHeader
          pageTitle=""
          currentPage="dashboard"
          onNavigate={onNavigate}
          showBackButton={false}
          headerVisible={headerVisible}
          leftActions={
            <p className="text-sm font-normal text-gray-600 dark:text-gray-300">
              Clarity is power.
            </p>
          }
        />

        <div className="max-w-4xl mx-auto p-6 pb-32 lg:pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome, {firstName}
            </h2>
            <p className="text-lg mt-1 text-gray-600 dark:text-gray-400">
              {entityName}'s Workspace
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {features.map((feature) => (
              <button
                key={feature.name}
                onClick={() => {
                  if (feature.name === 'Documents') {
                    onNavigate('documents')
                  } else if (feature.name === 'Receipts') {
                    onNavigate('receipts')
                  } else if (feature.name === 'Messages') {
                    onNavigate('messages')
                  } else if (feature.name === 'Bookmarks') {
                    onNavigate('bookmarks')
                  }
                }}
                className="rounded-2xl p-6 flex flex-col items-start gap-3 border transition-all duration-200 active:scale-95 min-h-[140px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 shadow-sm dark:shadow-none"
              >
                <feature.icon className={`w-12 h-12 ${feature.colorLight} dark:${feature.colorDark}`} />
                <span className="text-lg font-medium text-slate-900 dark:text-white">
                  {feature.name}
                </span>
              </button>
            ))}
          </div>

          {/* Inspirational Quote - Desktop/Tablet Only */}
          <blockquote className="hidden md:block text-center text-3xl italic mb-8 max-w-3xl mx-auto leading-relaxed text-gray-400 dark:text-white">
            "Gather receipts, organize docs, and chat with AI. Let's make accounting effortless."
          </blockquote>

          {/* Start Chatting Section */}
          <button onClick={() => onNavigate('chats')} className="w-full max-w-md mx-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl px-6 py-5 flex items-center justify-between transition-all duration-200 mb-6 hover:shadow-lg hover:shadow-emerald-500/50 active:scale-95">
            <div className="flex items-center gap-3">
              <img
                src={theme === 'dark' ? '/Grok_Logomark_Light.png' : '/Grok_Logomark_Dark.png'}
                alt="Grok"
                className="w-7 h-7"
              />
              <span className="text-xl font-semibold">Ai Chats</span>
            </div>
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* To Do List Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <button
                onClick={() => setIsViewAllModalOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/30"
                title="View All Tasks"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {[
                  { key: 'docs' as TaskCategory, label: 'Docs' },
                  { key: 'messages' as TaskCategory, label: 'Messages' },
                  { key: 'receipts' as TaskCategory, label: 'Receipts' },
                ].map((tab) => {
                  const count = getTaskCount(tab.key);
                  const isActive = activeCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveCategory(tab.key)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                      {count > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          isActive
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {count}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Task List */}
              <div className="p-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : (
                  <TaskList
                    tasks={getTasksByCategory(activeCategory)}
                    category={activeCategory}
                    onToggle={handleToggleComplete}
                    onClick={handleTodoClick}
                  />
                )}
              </div>
            </div>
          </div>

          <CreateTaskModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            defaultCategory={activeCategory}
            onSuccess={loadTodos}
          />

          <ViewAllModal
            isOpen={isViewAllModalOpen}
            onClose={() => setIsViewAllModalOpen(false)}
            onRefresh={loadTodos}
          />

          {selectedTodo && (
            <TodoDetailModal
              todo={selectedTodo}
              isOpen={showTodoModal}
              onClose={handleTodoModalClose}
              onToggleComplete={handleToggleComplete}
              onToggleBookmark={handleToggleBookmark}
              onDelete={handleDeleteTask}
              onUpdate={loadTodos}
            />
          )}
        </div>

        <UploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false)
            setSelectedFiles([])
          }}
          onUploadComplete={handleUploadComplete}
          pageType="receipts"
          preSelectedFiles={selectedFiles}
        />

        {/* Bottom Navigation - Mobile Only */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t px-6 py-4 pb-safe bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={handleToggleHeader}
              disabled={updatingHeader}
              className="rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title={headerVisible ? 'Lock header' : 'Unlock header'}
            >
              {updatingHeader ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
              ) : headerVisible ? (
                <Unlock className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </button>
            <UploadButton
              onFileSelected={handleFileSelected}
              accept="image/*,application/pdf"
              title="Upload receipt"
              className="rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200 bg-emerald-500 text-white"
              icon={<span className="text-2xl font-bold">+</span>}
            />
            <div className="w-12"></div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
