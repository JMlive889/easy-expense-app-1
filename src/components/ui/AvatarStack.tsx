import React, { useState } from 'react'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

interface AvatarStackProps {
  users: Profile[]
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarStack({ users, maxVisible = 3, size = 'md' }: AvatarStackProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const visibleUsers = users.slice(0, maxVisible)
  const remainingCount = users.length - maxVisible

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  const getInitials = (user: Profile) => {
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

  const getTooltipText = () => {
    return users.map(u => u.full_name || u.email).join(', ')
  }

  const handleImageError = (userId: string) => {
    console.warn(`Failed to load avatar image for user ${userId}`)
    setImageErrors(prev => {
      const newSet = new Set(prev)
      newSet.add(userId)
      return newSet
    })
  }

  const shouldShowImage = (user: Profile) => {
    return user.avatar_url &&
           user.avatar_url.trim() !== '' &&
           !imageErrors.has(user.id)
  }

  return (
    <div className="flex items-center -space-x-2" title={getTooltipText()}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold shadow-md overflow-hidden`}
          style={{ zIndex: visibleUsers.length - index }}
        >
          {shouldShowImage(user) ? (
            <img
              src={user.avatar_url!}
              alt={user.full_name || user.email || 'User'}
              className="w-full h-full object-cover"
              onError={() => handleImageError(user.id)}
            />
          ) : (
            <span>{getInitials(user)}</span>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-gray-900 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold shadow-md`}
          style={{ zIndex: 0 }}
        >
          <span>+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}
