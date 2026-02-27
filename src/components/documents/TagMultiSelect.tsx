import React, { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface TagMultiSelectProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  availableTags: string[]
  placeholder?: string
  disabled?: boolean
}

export function TagMultiSelect({
  selectedTags,
  onChange,
  availableTags,
  placeholder = 'Add tags',
  disabled = false
}: TagMultiSelectProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredTags = availableTags
    .filter(tag =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
    )
    .slice(0, 5)

  const showDropdown = isOpen && filteredTags.length > 0 && inputValue.trim() !== ''

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

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag.trim())) {
      onChange([...selectedTags, tag.trim()])
      setInputValue('')
      setIsOpen(false)
      inputRef.current?.focus()
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showDropdown && filteredTags[highlightedIndex]) {
        handleAddTag(filteredTags[highlightedIndex])
      } else if (inputValue.trim()) {
        handleAddTag(inputValue.trim())
      }
      return
    }

    if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
      e.preventDefault()
      handleRemoveTag(selectedTags[selectedTags.length - 1])
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
    handleAddTag(tag)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 min-h-[50px] focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
        {selectedTags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              disabled={disabled}
              className="hover:text-emerald-900 dark:hover:text-emerald-200 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-white"
          disabled={disabled}
        />
      </div>

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
