import { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FlowingALogo from './FlowingALogo';

interface NavigationProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navigation({ darkMode, toggleDarkMode }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);

    if (location.pathname === '/') {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  };

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
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-1.5">
              <FlowingALogo />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Accounting Module
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('home')}
              className="text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('support')}
              className="text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Support
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Contact
            </button>
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

          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-teal-heart/10"
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
              className="text-teal-heart"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden dark:bg-bg-black/98 bg-white/98 backdrop-blur-lg border-t border-teal-heart/20">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection('home')}
              className="block w-full text-left py-2 text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left py-2 text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('support')}
              className="block w-full text-left py-2 text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Support
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left py-2 text-gray-900 dark:text-gray-300 hover:text-teal-heart transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="w-full mt-4 px-6 py-3 rounded-lg bg-teal-heart text-bg-black font-semibold"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
