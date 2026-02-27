import React, { useState, useRef } from 'react'
import { ChevronDown, Inbox, Send, Mail } from 'lucide-react'
import { useClickOutside } from '../../hooks/useClickOutside'

interface MessageTypeDropdownProps {
  value: 'inbox' | 'sent' | 'all'
  onChange: (value: 'inbox' | 'sent' | 'all') => void
}

export function MessageTypeDropdown({ value, onChange }: MessageTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropdownRef, () => setIsOpen(false))

  const options = [
    { value: 'inbox' as const, label: 'Inbox', icon: Inbox },
    { value: 'sent' as const, label: 'Sent', icon: Send },
    { value: 'all' as const, label: 'All', icon: Mail }
  ]

  const selectedOption = options.find(opt => opt.value === value)
  const SelectedIcon = selectedOption?.icon || Mail

  const handleSelect = (newValue: 'inbox' | 'sent' | 'all') => {
    onChange(newValue)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <SelectedIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {selectedOption?.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  value === option.value
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
