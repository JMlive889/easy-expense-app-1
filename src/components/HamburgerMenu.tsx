import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, Settings, LogOut, Home, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { RoleDisplay } from '../lib/supabase';
import Avatar from './Avatar';
import { PageType } from '../App';
import { useClickOutside } from '../hooks/useClickOutside';

interface HamburgerMenuProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export default function HamburgerMenu({ currentPage, onNavigate }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const { permissions } = useRBAC();
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleNavigation = (page: PageType) => {
    onNavigate(page);
    setIsOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-lg transition-all duration-200 text-slate-900 dark:text-white bg-gray-100/80 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20 shadow-sm hover:shadow-md"
        aria-label="Menu"
      >
        {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
      </button>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
            onClick={handleBackdropClick}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ touchAction: 'none' }}
          />

          <div
            ref={menuRef}
            className="fixed z-[60] shadow-2xl border flex flex-col max-lg:top-16 max-lg:left-0 max-lg:right-0 max-lg:mx-4 max-lg:rounded-2xl max-lg:animate-slide-down max-lg:max-h-[calc(100vh-6rem)] lg:top-0 lg:right-0 lg:h-screen lg:w-96 lg:animate-slide-in-right bg-white dark:bg-slate-800 border-gray-200 dark:border-emerald-500/30"
          >
            <div className="px-4 py-4 border-b shrink-0 border-gray-200 dark:border-emerald-500/20">
              <div className="flex items-center gap-3">
                <Avatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-slate-900 dark:text-white">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-sm truncate text-gray-600 dark:text-gray-400">
                    {profile?.email}
                  </p>
                  {profile?.role && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        RoleDisplay[profile.role].bgColor
                      } ${RoleDisplay[profile.role].color}`}>
                        {RoleDisplay[profile.role].label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <nav className="py-2 overflow-y-auto flex-1">
              <button
                onClick={() => handleNavigation('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-600/30 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              {permissions.canViewReports && (
                <button
                  onClick={() => handleNavigation('reports')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    currentPage === 'reports'
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-600/30 dark:text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Reports</span>
                </button>
              )}

              <button
                onClick={() => handleNavigation('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  currentPage === 'settings'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-600/30 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>

              <div className="border-t my-2 border-gray-200 dark:border-emerald-500/20" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
