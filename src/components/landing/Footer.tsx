import { Twitter, Linkedin, Github } from 'lucide-react';
import { useState } from 'react';

interface FooterProps {
  onNavigate?: (page: 'landing') => void;
  darkMode?: boolean;
}

export default function Footer({ onNavigate, darkMode }: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setIsSubscribed(false);
    }, 3000);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className="relative dark:bg-bg-black bg-white border-t border-teal-heart/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <img
                src={darkMode ? "/EZ_Logo_(1).png" : "/EZ_Logo.png"}
                alt="Easy Expense App Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-teal-heart">
                Easy Expense App
              </span>
            </div>
            <p className="text-base dark:text-gray-400 text-gray-900 mb-6 leading-relaxed">
              Revolutionary expense management built for transparency, efficiency, and peace of mind.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-teal-heart/10 hover:bg-teal-heart/20 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-teal-heart" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-teal-heart/10 hover:bg-teal-heart/20 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-teal-heart" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-teal-heart/10 hover:bg-teal-heart/20 flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-teal-heart" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="dark:text-white text-gray-900 font-bold text-lg mb-6">Product</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors"
                >
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="dark:text-white text-gray-900 font-bold text-lg mb-6">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors">
                  Video Tutorials
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-teal-heart/20 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h3 className="dark:text-white text-gray-900 font-bold text-lg mb-4">Subscribe to Our Newsletter</h3>
            <p className="dark:text-gray-400 text-gray-900 mb-4 text-base">
              Get the latest updates, tips, and exclusive offers
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 px-4 py-2 rounded-lg dark:bg-bg-black bg-white border border-teal-heart/30 dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 focus:outline-none focus:border-teal-heart transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-teal-heart text-bg-black font-semibold hover:shadow-lg hover:shadow-teal-heart/50 transition-all whitespace-nowrap"
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-teal-heart/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="dark:text-gray-400 text-gray-900 text-sm">
            &copy; 2026 Easy Expense App. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a href="#" className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors">
              Terms of Service
            </a>
            <a href="#" className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors">
              Cookie Policy
            </a>
            <a href="#" className="dark:text-gray-400 text-gray-900 hover:text-teal-heart transition-colors">
              GDPR
            </a>
          </div>
          <p className="dark:text-gray-400 text-gray-900 text-sm">
            <button
              onClick={() => onNavigate?.('landing')}
              className="hover:text-teal-heart transition-colors"
            >
              easyexpenseapp.com
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
}
