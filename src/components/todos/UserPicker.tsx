import React, { useState, useEffect } from 'react'
import { X, Plus, Search, Check } from 'lucide-react'
import { getEntityUsers } from '../../lib/todos'
import { useAuth } from '../../contexts/AuthContext'

interface User {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

interface UserPickerProps {
  selectedUsers: User[]
  onSelectionChange: (users: User[]) => void
  disabled?: boolean
}

export function UserPicker({ selectedUsers, onSelectionChange, disabled }: UserPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const { profile } = useAuth()

  useEffect(() => {
    loadUsers()
  }, [profile?.current_entity_id])

  const loadUsers = async () => {
    if (!profile?.current_entity_id) return

    setLoading(true)
    try {
      const { data, error } = await getEntityUsers(profile.current_entity_id)
      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = availableUsers.filter((user) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const matchesName = user.full_name?.toLowerCase().includes(query)
    const matchesEmail = user.email?.toLowerCase().includes(query)

    return matchesName || matchesEmail
  })

  const isUserSelected = (userId: string) => {
    return selectedUsers.some((selected) => selected.id === userId)
  }

  const handleToggleUser = (user: User) => {
    if (isUserSelected(user.id)) {
      onSelectionChange(selectedUsers.filter((u) => u.id !== user.id))
    } else {
      onSelectionChange([...selectedUsers, user])
    }
  }

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUsers.filter((u) => u.id !== userId))
  }

  const getInitials = (user: User) => {
    if (user.full_name) {
      const names = user.full_name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return user.full_name.substring(0, 2).toUpperCase()
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return '??'
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedUsers.map((user) => (
          <div
            key={user.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.email || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(user)}</span>
              )}
            </div>
            <span>{user.full_name || user.email}</span>
            <button
              type="button"
              onClick={() => handleRemoveUser(user.id)}
              disabled={disabled}
              className="hover:text-emerald-900 dark:hover:text-emerald-300 disabled:opacity-50"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-sm hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {isOpen && (
        <div className="relative mt-2 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {loading ? (
              <div className="py-4 text-center text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => {
                const selected = isUserSelected(user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleToggleUser(user)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.email || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(user)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.full_name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected
                        ? 'bg-emerald-500 dark:bg-emerald-600'
                        : 'border-2 border-gray-300 dark:border-gray-600'
                    }`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
