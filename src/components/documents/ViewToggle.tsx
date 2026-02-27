import React from 'react'
import { Grid, List } from 'lucide-react'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      <button
        onClick={() => onChange('grid')}
        className={`
          p-2 rounded-lg transition-all
          ${view === 'grid'
            ? 'bg-emerald-500 text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }
        `}
        title="Grid view"
      >
        <Grid className="w-5 h-5" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`
          p-2 rounded-lg transition-all
          ${view === 'list'
            ? 'bg-emerald-500 text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }
        `}
        title="List view"
      >
        <List className="w-5 h-5" />
      </button>
    </div>
  )
}
