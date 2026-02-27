import { ArrowRight, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function CTASection() {
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="cta" className="relative py-20 dark:bg-bg-black bg-gray-50 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0, 212, 255, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="dark:text-white text-gray-900">Ready to Transform</span>
          <br />
          <span className="text-teal-heart">
            Your Expense Management?
          </span>
        </h2>

        <p className="text-xl md:text-2xl dark:text-gray-400 text-gray-900 mb-12 max-w-3xl mx-auto">
          Join forward-thinking teams who've said goodbye to chaos and hello to clarity
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center justify-center space-x-2 dark:text-gray-300 text-gray-700">
            <CheckCircle className="w-5 h-5 text-success-green" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center justify-center space-x-2 dark:text-gray-300 text-gray-700">
            <CheckCircle className="w-5 h-5 text-success-green" />
            <span>7-day free trial</span>
          </div>
          <div className="flex items-center justify-center space-x-2 dark:text-gray-300 text-gray-700">
            <CheckCircle className="w-5 h-5 text-success-green" />
            <span>Cancel anytime</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              className="flex-1 px-6 py-4 rounded-lg dark:bg-bg-black bg-white border-2 border-teal-heart/30 dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 focus:outline-none focus:border-teal-heart transition-colors text-lg"
            />
            <button
              type="submit"
              className="group px-8 py-4 rounded-lg bg-teal-heart text-bg-black font-bold text-lg hover:shadow-2xl hover:shadow-teal-heart/50 transition-all flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <span>{isSubmitted ? 'Request Sent!' : 'Start your Free Trial'}</span>
              {!isSubmitted && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://calendar.app.google/XdQfYroqQPKUPt5W7"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-lg border-2 border-teal-heart text-teal-heart font-semibold hover:bg-teal-heart/10 transition-all inline-block"
          >
            Schedule a Call
          </a>
          <button
            onClick={() => scrollToSection('pricing')}
            className="px-8 py-3 rounded-lg border-2 border-accent-lime dark:text-accent-lime text-teal-heart dark:border-accent-lime border-teal-heart font-semibold hover:bg-accent-lime/10 transition-all"
          >
            View Pricing
          </button>
        </div>
      </div>
    </section>
  );
}
