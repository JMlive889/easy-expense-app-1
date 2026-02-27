import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 dark:bg-bg-black bg-white"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-teal-heart">
                Expense App
              </span>
              <br />
              <span className="dark:text-white text-gray-900">with AI-Powered by Grok</span>
            </h1>

            <p className="text-xl md:text-2xl dark:text-gray-400 text-gray-900 mb-10">
              The backbone for your accounting ecosystem—starting with our seamless Expense App. Transparent, error-free, and built for control.
            </p>

            <button
              onClick={() => scrollToSection('cta')}
              className="group px-8 py-4 rounded-lg bg-teal-heart text-bg-black font-semibold text-lg hover:shadow-2xl hover:shadow-teal-heart/50 transition-all flex items-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="animate-slide-up lg:block hidden">
            <div className="relative aspect-square bg-deep-green/30 rounded-2xl border border-teal-heart/30 flex items-center justify-center overflow-hidden">
              <img
                src="/screenshot_2026-01-31_at_6.45.55_pm.png"
                alt="Expense App User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
