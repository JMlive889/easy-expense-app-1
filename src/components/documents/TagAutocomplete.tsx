import React, { useState, useRef, useEffect } from 'react'

interface TagAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAdd: () => void
  tags: string[]
  disabled?: boolean
  placeholder?: string
}

export function TagAutocomplete({
  value,
  onChange,
  onAdd,
  tags,
  disabled = false,
  placeholder = 'Add a tag'
}: TagAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredTags = tags
    .filter(tag => tag.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 3)

  const showDropdown = isOpen && filteredTags.length > 0 && value.trim() !== ''

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredTags.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showDropdown && filteredTags[highlightedIndex]) {
        onChange(filteredTags[highlightedIndex])
        setIsOpen(false)
      }
      onAdd()
      return
    }

    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredTags.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }

  const handleSelectTag = (tag: string) => {
    onChange(tag)
    setIsOpen(false)
    onAdd()
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        disabled={disabled}
      />

      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          {filteredTags.map((tag, index) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSelectTag(tag)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full px-4 py-3 text-left transition-colors ${
                index === highlightedIndex
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
