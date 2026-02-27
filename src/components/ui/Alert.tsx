import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

interface AlertProps {
  children: React.ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info'
  className?: string
}

export function Alert({ children, variant = 'info', className = '' }: AlertProps) {
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400',
      icon: CheckCircle,
      iconColor: 'text-green-500 dark:text-green-400'
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400',
      icon: XCircle,
      iconColor: 'text-red-500 dark:text-red-400'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-400',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500 dark:text-yellow-400'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400',
      icon: Info,
      iconColor: 'text-blue-500 dark:text-blue-400'
    }
  }

  const { container, icon: Icon, iconColor } = variants[variant]

  return (
    <div className={`border rounded-md p-4 ${container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3">
          {children}
        </div>
      </div>
    </div>
  )
}