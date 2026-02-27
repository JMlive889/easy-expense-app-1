import { useState, useEffect } from 'react';
import { ArrowRight, Eye } from 'lucide-react';

interface StickyBannerProps {
  darkMode: boolean;
}

export default function StickyBanner({ darkMode }: StickyBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('home');
      if (heroSection) {
        const heroHeight = heroSection.offsetHeight;
        const scrollPosition = window.scrollY;
        const threshold = heroHeight * 0.8;

        setIsVisible(scrollPosition > threshold);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`fixed top-16 md:top-20 left-0 right-0 z-40 transition-all duration-500 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3">
        <div
          className={`
            rounded-xl border transition-colors
            ${
              darkMode
                ? 'bg-bg-black/95 border-teal-heart/30'
                : 'bg-white/95 border-gray-200'
            }
            backdrop-blur-lg shadow-xl
          `}
        >
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-teal-heart/10 border border-teal-heart/30">
                  <img
                    src="/screenshot_2026-01-30_at_8.54.02_pm.png"
                    alt="Preview thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`text-lg font-semibold truncate ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Expense Management Platform
                </h3>
                <p
                  className={`text-base truncate ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  AI-powered accounting made simple
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => scrollToSection('features')}
                className={`
                  hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg
                  font-medium transition-all
                  ${
                    darkMode
                      ? 'bg-teal-heart/10 text-gray-300 hover:bg-teal-heart/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => scrollToSection('cta')}
                className="
                  flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg
                  bg-teal-heart text-bg-black font-semibold
                  hover:shadow-lg hover:shadow-teal-heart/50
                  transition-all
                "
              >
                <span className="hidden sm:inline">Try it now</span>
                <span className="sm:hidden">Start</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
