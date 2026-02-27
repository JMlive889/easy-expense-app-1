import React, { useState, useRef, useEffect } from 'react'

interface VendorAutocompleteProps {
  value: string
  onChange: (value: string) => void
  vendors: string[]
  disabled?: boolean
  placeholder?: string
  required?: boolean
}

export function VendorAutocomplete({
  value,
  onChange,
  vendors,
  disabled = false,
  placeholder = 'Enter vendor name',
  required = false
}: VendorAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredVendors = vendors
    .filter(vendor => vendor.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 3)

  const showDropdown = isOpen && filteredVendors.length > 0 && value.trim() !== ''

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
  }, [filteredVendors.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredVendors.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        if (filteredVendors[highlightedIndex]) {
          e.preventDefault()
          onChange(filteredVendors[highlightedIndex])
          setIsOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }

  const handleSelectVendor = (vendor: string) => {
    onChange(vendor)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className="relative">
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
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        required={required}
        disabled={disabled}
      />

      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          {filteredVendors.map((vendor, index) => (
            <button
              key={vendor}
              type="button"
              onClick={() => handleSelectVendor(vendor)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full px-4 py-3 text-left transition-colors ${
                index === highlightedIndex
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {vendor}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
