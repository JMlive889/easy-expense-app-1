import React, { useState, useRef, useEffect } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { useClickOutside } from '../../hooks/useClickOutside'

interface VendorSelectProps {
  vendors: string[]
  selectedVendor: string | null
  onSelect: (vendor: string | null) => void
}

export function VendorSelect({ vendors, selectedVendor, onSelect }: VendorSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useClickOutside(containerRef, () => {
    setIsOpen(false)
    setSearchQuery('')
  })

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const filteredVendors = vendors.filter(vendor =>
    vendor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (vendor: string) => {
    onSelect(vendor)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all
          ${isOpen
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
          }
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className={`truncate ${selectedVendor ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
            {selectedVendor || 'Select vendor...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedVendor && (
            <button
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl max-h-64 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredVendors.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No vendors found
              </div>
            ) : (
              <div className="py-2">
                {filteredVendors.map(vendor => (
                  <button
                    key={vendor}
                    onClick={() => handleSelect(vendor)}
                    className={`
                      w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                      ${selectedVendor === vendor ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-900 dark:text-white'}
                    `}
                  >
                    {vendor}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
