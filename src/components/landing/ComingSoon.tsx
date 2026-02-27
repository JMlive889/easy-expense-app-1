import { Rocket, Timer, LinkIcon, Zap } from 'lucide-react';
import { useState } from 'react';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="relative py-20 dark:bg-bg-black bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-teal-heart/50 bg-teal-heart/10 mb-6">
            <Rocket className="w-4 h-4 text-accent-lime" />
            <span className="text-sm text-accent-lime font-medium">Coming Soon</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="dark:text-white text-gray-900">Coming Soon:</span>
            <br />
            <span className="text-teal-heart">
              The Full Platform
            </span>
          </h2>
          <p className="text-xl dark:text-gray-400 text-gray-900 max-w-3xl mx-auto">
            We're building a complete financial operations ecosystem. Get early access to upcoming features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="relative p-8 rounded-2xl dark:bg-secondary-dark bg-white border border-teal-heart/40 overflow-hidden group hover:border-teal-heart/50 transition-all">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent-lime/20 text-accent-lime text-xs font-bold">
              Q2 2026
            </div>
            <Timer className="w-12 h-12 text-teal-heart mb-4" />
            <h3 className="text-2xl font-bold dark:text-white text-gray-900 mb-3">Timetracking Integration</h3>
            <p className="text-base dark:text-gray-400 text-gray-900 mb-4">
              Seamlessly connect expenses with time entries. Automatically associate costs with projects and billable hours.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-500">
                <Zap className="w-4 h-4 text-success-green mr-2" />
                Project-based tracking
              </li>
              <li className="flex items-center text-sm text-gray-500">
                <Zap className="w-4 h-4 text-success-green mr-2" />
                Billable hours sync
              </li>
            </ul>
          </div>

          <div className="relative p-8 rounded-2xl dark:bg-secondary-dark bg-white border border-teal-heart/40 overflow-hidden group hover:border-teal-heart/50 transition-all">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent-lime/20 text-accent-lime text-xs font-bold">
              Q3 2026
            </div>
            <LinkIcon className="w-12 h-12 text-teal-heart mb-4" />
            <h3 className="text-2xl font-bold dark:text-white text-gray-900 mb-3">Accounting System Sync</h3>
            <p className="text-base dark:text-gray-400 text-gray-900 mb-4">
              Direct integration with major accounting platforms. Real-time data synchronization for accurate financials.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-500">
                <Zap className="w-4 h-4 text-success-green mr-2" />
                QuickBooks integration
              </li>
              <li className="flex items-center text-sm text-gray-500">
                <Zap className="w-4 h-4 text-success-green mr-2" />
                Xero compatibility
              </li>
            </ul>
          </div>

          <div className="relative p-8 rounded-2xl dark:bg-secondary-dark bg-white border border-teal-heart/40 overflow-hidden group hover:border-teal-heart/50 transition-all">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent-lime/20 text-accent-lime text-xs font-bold">
              Q4 2026
            </div>
            <Rocket className="w-12 h-12 text-teal-heart mb-4" />
            <h3 className="text-2xl font-bold dark:text-white text-gray-900 mb-3">Native Mobile Apps</h3>
            <p className="text-base dark:text-gray-400 text-gray-900 mb-4">
              Full-featured iOS and Android apps with offline support and advanced camera features for receipt capture.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-500">
                <Zap className="w-4 h-4 text-success-green mr-2" />
                Offline mode
              </li>
              <li className="flex items-center text-sm text-gray-500">
                <Zap className="w-4 h-4 text-success-green mr-2" />
                Enhanced OCR
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-8 rounded-2xl dark:bg-teal-heart/10 bg-gray-100 border border-teal-heart/30">
          <h3 className="text-2xl font-bold dark:text-white text-gray-900 text-center mb-4">
            Join the Waitlist
          </h3>
          <p className="text-base dark:text-gray-400 text-gray-900 text-center mb-6">
            Be the first to know when new features launch. Get exclusive early access.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-3 rounded-lg dark:bg-bg-black bg-white border border-teal-heart/30 dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 focus:outline-none focus:border-teal-heart transition-colors"
            />
            <button
              type="submit"
              className="px-8 py-3 rounded-lg bg-teal-heart text-bg-black font-semibold hover:shadow-lg hover:shadow-teal-heart/50 transition-all whitespace-nowrap"
            >
              {isSubmitted ? 'You\'re on the list!' : 'Join Waitlist'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
