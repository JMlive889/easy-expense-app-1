import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import FlowingALogo from './FlowingALogo';

interface NavigationProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navigation({ darkMode, toggleDarkMode }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'dark:bg-bg-black/95 bg-white/95 backdrop-blur-lg border-b border-teal-heart/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-1.5">
              <FlowingALogo />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Accounting Module
            </span>
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-teal-heart/10 hover:bg-teal-heart/20 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-accent-lime" />
            ) : (
              <Moon className="w-5 h-5 text-teal-heart" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
