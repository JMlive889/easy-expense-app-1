import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  showPasswordToggle?: boolean
}

export function Input({ label, error, icon, showPasswordToggle, className = '', ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const isPasswordInput = props.type === 'password'
  const shouldShowToggle = showPasswordToggle && isPasswordInput
  const inputType = shouldShowToggle && showPassword ? 'text' : props.type

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          type={inputType}
          className={`block w-full ${icon ? 'pl-10' : ''} ${shouldShowToggle ? 'pr-10' : ''} px-3 py-2 rounded-md shadow-sm focus:outline-none border bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500' : ''
          } ${className}`}
        />
        {shouldShowToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}