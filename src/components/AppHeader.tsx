import React from 'react'
import { ArrowLeft, Building2 } from 'lucide-react'
import { PageType } from '../App'
import HamburgerMenu from './HamburgerMenu'
import { useAuth } from '../contexts/AuthContext'
import { getEntityLogo } from '../lib/entityLogo'

interface AppHeaderProps {
  pageTitle: string
  currentPage: PageType | string
  onNavigate?: (page: PageType) => void
  onBack?: () => void
  showBackButton?: boolean
  leftActions?: React.ReactNode
  rightActions?: React.ReactNode
  headerVisible?: boolean
}

export function AppHeader({
  pageTitle,
  currentPage,
  onNavigate,
  onBack,
  showBackButton = true,
  leftActions,
  rightActions,
  headerVisible = true
}: AppHeaderProps) {
  const { entity } = useAuth();
  const [entityLogoUrl, setEntityLogoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (entity?.id) {
      getEntityLogo(entity.id).then(setEntityLogoUrl);
    } else {
      setEntityLogoUrl(null);
    }
  }, [entity?.id]);

  const handleBackClick = () => {
    if (onBack) {
      onBack()
    } else if (onNavigate) {
      onNavigate('dashboard')
    }
  }

  const handleEntityClick = () => {
    if (onNavigate) {
      onNavigate('entities');
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700">
      {headerVisible && (
        <div
          className="bg-[#2D9F84] flex items-center justify-between px-4 py-3 transition-all duration-300"
          style={{ paddingTop: 'calc(0.75rem + var(--safe-area-inset-top))' }}
        >
          <h1 className="text-2xl font-black text-white tracking-wide">
            Easy Expense App
          </h1>
          <div className="flex justify-end">
            {entity && (
              <button
                onClick={handleEntityClick}
                className="group relative flex items-center gap-3"
                title="Entities"
              >
                <div className="border-2 border-white shadow-md rounded-full group-hover:scale-105 transition-transform bg-white w-10 h-10 flex items-center justify-center overflow-hidden">
                  {entityLogoUrl ? (
                    <img
                      src={entityLogoUrl}
                      alt={entity.entity_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-[#2D9F84]" />
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {leftActions}
              {showBackButton && (
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {rightActions}
              {onNavigate && (
                <div className="lg:hidden">
                  <HamburgerMenu currentPage={currentPage as PageType} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
