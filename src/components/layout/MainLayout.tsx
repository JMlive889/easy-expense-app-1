import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { DesktopFooter } from './DesktopFooter'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import type { PageType } from '../../App'

interface MainLayoutProps {
  children: React.ReactNode
  currentPage: PageType
  onNavigate: (page: PageType) => void
}

export function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
  const isDesktop = useIsDesktop()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    setSidebarCollapsed(stored === 'true')

    const handleStorage = () => {
      const stored = localStorage.getItem('sidebar-collapsed')
      setSidebarCollapsed(stored === 'true')
    }

    window.addEventListener('storage', handleStorage)
    const interval = setInterval(handleStorage, 100)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  if (!isDesktop) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
        <div className={`flex-1 transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <div className="flex-1">
            {children}
          </div>
          <DesktopFooter />
        </div>
      </div>
    </div>
  )
}
