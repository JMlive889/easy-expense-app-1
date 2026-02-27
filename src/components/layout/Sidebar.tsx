import React, { useState, useEffect } from 'react'
import {
  Home,
  MessageSquare,
  Bookmark,
  Receipt,
  FileText,
  Mail,
  ListTodo,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react'
import Avatar from '../Avatar'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useRBAC } from '../../hooks/useRBAC'
import { updateHeaderVisibility } from '../../lib/profiles'
import type { PageType } from '../../App'

interface SidebarProps {
  currentPage: PageType
  onNavigate: (page: PageType) => void
}

interface NavItem {
  id: PageType
  label: string
  icon: React.ReactNode
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { user, profile, entity, signOut, updateProfile } = useAuth()
  const { showToast } = useToast()
  const { permissions } = useRBAC()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [entityLogo, setEntityLogo] = useState<string | null>(null)
  const [entityName, setEntityName] = useState<string | null>(null)
  const [updatingHeader, setUpdatingHeader] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  useEffect(() => {
    if (profile?.current_entity_id) {
      import('../../lib/entityLogo').then(({ getEntityLogo }) => {
        getEntityLogo(profile.current_entity_id!).then(setEntityLogo)
      })
    }
  }, [profile?.current_entity_id])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'chats', label: 'Chats', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark className="w-5 h-5" /> },
    { id: 'receipts', label: 'Receipts', icon: <Receipt className="w-5 h-5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <Mail className="w-5 h-5" /> },
    { id: 'todos', label: 'Todos', icon: <ListTodo className="w-5 h-5" /> },
    ...(permissions.canViewReports ? [{ id: 'reports' as PageType, label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> }] : []),
    { id: 'entities', label: 'Entities', icon: <Building2 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ]

  const handleSignOut = async () => {
    await signOut()
    onNavigate('login')
  }

  const handleToggleHeader = async () => {
    if (!user || updatingHeader) return

    const newVisibility = !profile?.header_visible
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

  const headerVisible = profile?.header_visible ?? true

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } fixed left-0 top-0 z-20`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar name={profile?.full_name || user?.email || ''} avatarUrl={profile?.avatar_url} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center w-full">
            <Avatar name={profile?.full_name || user?.email || ''} avatarUrl={profile?.avatar_url} size="sm" />
          </div>
        )}
      </div>

      {profile?.current_entity_id && (
        <div className={`p-4 border-b border-gray-200 dark:border-gray-800 ${isCollapsed ? 'flex justify-center' : 'flex items-center gap-3'}`}>
          {entityLogo ? (
            <img
              src={entityLogo}
              alt="Entity"
              className={`rounded-lg object-cover ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}
            />
          ) : (
            <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center`}>
              <Building2 className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
            </div>
          )}
          {!isCollapsed && entity && (
            <span className="text-sm font-normal text-gray-900 dark:text-white">
              {entity.entity_name}
            </span>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-800 p-2">
        <button
          onClick={handleToggleHeader}
          disabled={updatingHeader}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          } ${updatingHeader ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isCollapsed ? (headerVisible ? 'Lock Header' : 'Unlock Header') : undefined}
        >
          {headerVisible ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {headerVisible ? 'Lock Header' : 'Unlock Header'}
            </span>
          )}
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-2">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-2">
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
