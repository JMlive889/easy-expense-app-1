import { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X } from 'lucide-react';

interface NavigationProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  onNavigate?: (page: string) => void;
}

export default function Navigation({ darkMode, toggleDarkMode, onNavigate }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuClick = (id: string) => {
    if (id === 'video-tutorials' && onNavigate) {
      onNavigate('video-tutorials');
      setIsMobileMenuOpen(false);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    { label: 'Home', id: 'home' },
    { label: 'Features', id: 'features' },
    { label: 'Video Tutorials', id: 'video-tutorials' },
    { label: 'Pricing', id: 'pricing' }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'dark:bg-bg-black/95 bg-white/95 backdrop-blur-lg border-b border-teal-heart/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleMenuClick('home')}>
            <img
              src={darkMode ? "/EZ_Logo_-_White.png" : "/EZ_Logo_-_Black.png"}
              alt="Easy Expense App Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Easy Expense App
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className="text-gray-700 dark:text-gray-300 hover:text-teal-heart dark:hover:text-teal-heart transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}

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

          <div className="md:hidden flex items-center space-x-2">
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

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-teal-heart/10 hover:bg-teal-heart/20 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-teal-heart" />
              ) : (
                <Menu className="w-5 h-5 text-teal-heart" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-teal-heart/20">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-teal-heart/10 rounded-lg transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
