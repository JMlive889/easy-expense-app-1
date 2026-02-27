import React from 'react'

export type TabValue = string

interface Tab {
  value: TabValue
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: TabValue
  onChange: (value: TabValue) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={`
                pb-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${isActive
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
