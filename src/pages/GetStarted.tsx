import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, ArrowRight, CheckCircle, LayoutDashboard } from 'lucide-react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigateFn = (page: string, chatId?: string, licenseData?: any, scrollTarget?: string) => void;

interface GetStartedProps {
  onNavigate?: NavigateFn;
}

const carouselSlides = [
  {
    src: '/image copy copy.png',
    alt: 'Easy Expense App Dashboard on mobile',
    caption: 'Track expenses on the go',
  },
  {
    src: '/Dashboard.jpg',
    alt: 'Easy Expense App full dashboard',
    caption: 'Powerful dashboard overview',
  },
  {
    src: '/Screenshot_2026-02-17_at_6.40.30_AM.png',
    alt: 'Receipt scanning and AI analysis',
    caption: 'AI-powered receipt scanning',
  },
  {
    src: '/screenshot_2026-01-31_at_6.45.55_pm.png',
    alt: 'Team collaboration features',
    caption: 'Collaborate with your accountant',
  },
];

function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (index: number, dir: 'left' | 'right') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 320);
  };

  const prev = () => {
    const idx = (current - 1 + carouselSlides.length) % carouselSlides.length;
    goTo(idx, 'left');
  };

  const next = () => {
    const idx = (current + 1) % carouselSlides.length;
    goTo(idx, 'right');
  };

  useEffect(() => {
    timerRef.current = setTimeout(next, 4500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 rounded-2xl overflow-hidden bg-teal-heart/5 border border-teal-heart/20 min-h-0">
        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            animating
              ? direction === 'right'
                ? '-translate-x-6 opacity-0'
                : 'translate-x-6 opacity-0'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <img
            src={carouselSlides[current].src}
            alt={carouselSlides[current].alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-5">
            <p className="text-white font-medium text-lg">{carouselSlides[current].caption}</p>
          </div>
        </div>

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        {carouselSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 'right' : 'left')}
            className={`rounded-full transition-all duration-200 ${
              i === current
                ? 'w-6 h-2.5 bg-teal-heart'
                : 'w-2.5 h-2.5 bg-teal-heart/30 hover:bg-teal-heart/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.39c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.31 3.1-2.53 4zm-3.03-17.1c-.06 2.03 1.72 3.7 3.6 3.55.27-1.97-1.59-3.73-3.6-3.55z"/>
    </svg>
  );
}

export default function GetStarted({ onNavigate }: GetStartedProps) {
  const { user, profile } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    localStorage.setItem('theme_preference', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 300);
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/oauth/consent`,
      },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
        setError('An account with this email already exists. Try signing in.');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      onNavigate?.('dashboard');
    }, 800);
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-bg-black text-white' : 'bg-white text-gray-900'}`}>
      <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={onNavigate} />

      <main className="flex-1 flex flex-col pt-20">
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="dark:text-white text-gray-900">Manage your team expenses, and</span>
              <br className="hidden sm:block" />
              <span className="text-teal-heart"> communicate with your accountant.</span>
              <br className="hidden sm:block" />
              <span className="dark:text-white text-gray-900"> All in one app.</span>
            </h1>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 min-h-0 lg:items-stretch">
            <div className="hidden lg:flex flex-col" style={{ minHeight: '520px' }}>
              <ImageCarousel />
            </div>

            <div className="flex flex-col justify-center">
              {user && profile && (
                <div className={`rounded-xl border px-5 py-4 mb-5 flex items-center justify-between gap-4 ${
                  darkMode
                    ? 'bg-teal-heart/10 border-teal-heart/30'
                    : 'bg-teal-heart/10 border-teal-heart/30'
                }`}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-teal-heart">Already signed in</p>
                    <p className="text-sm dark:text-gray-400 text-gray-600 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={() => onNavigate?.('dashboard')}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-heart text-bg-black font-semibold text-sm hover:shadow-lg hover:shadow-teal-heart/30 transition-all duration-200"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </button>
                </div>
              )}

              <div className={`rounded-2xl border p-8 shadow-xl ${
                darkMode
                  ? 'bg-secondary-dark border-teal-heart/20'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-1">Create your free account</h2>
                <p className="dark:text-gray-400 text-gray-600 mb-6 text-sm">
                  {user ? 'Sign up with a different email to create a second account.' : 'No credit card required. 7-day free trial.'}
                </p>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => handleOAuth('google')}
                    disabled={!!oauthLoading || loading}
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold text-base transition-all duration-200 ${
                      darkMode
                        ? 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30'
                        : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {oauthLoading === 'google' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span>Continue with Google</span>
                  </button>

                  <button
                    onClick={() => handleOAuth('apple')}
                    disabled={!!oauthLoading || loading}
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold text-base transition-all duration-200 ${
                      darkMode
                        ? 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30'
                        : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {oauthLoading === 'apple' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <AppleIcon />
                    )}
                    <span>Continue with Apple</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className={`flex-1 h-px ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                  <span className="text-sm dark:text-gray-500 text-gray-400">or sign up with email</span>
                  <div className={`flex-1 h-px ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                </div>

                {success ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <CheckCircle className="w-12 h-12 text-teal-heart" />
                    <p className="text-lg font-semibold dark:text-white text-gray-900">Account created!</p>
                    <p className="text-sm dark:text-gray-400 text-gray-600">Taking you to your dashboard...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">
                        Email <span className="text-teal-heart">*</span>
                      </label>
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className={`w-full px-4 py-3 rounded-xl border text-base transition-colors focus:outline-none focus:border-teal-heart ${
                          darkMode
                            ? 'bg-bg-black border-white/10 text-white placeholder-gray-600 focus:border-teal-heart'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-heart'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">
                        Full Name <span className="dark:text-gray-600 text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Smith"
                        className={`w-full px-4 py-3 rounded-xl border text-base transition-colors focus:outline-none focus:border-teal-heart ${
                          darkMode
                            ? 'bg-bg-black border-white/10 text-white placeholder-gray-600 focus:border-teal-heart'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-heart'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">
                        Password <span className="text-teal-heart">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder="Min. 6 characters"
                          className={`w-full px-4 py-3 pr-12 rounded-xl border text-base transition-colors focus:outline-none focus:border-teal-heart ${
                            darkMode
                              ? 'bg-bg-black border-white/10 text-white placeholder-gray-600 focus:border-teal-heart'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-heart'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 hover:text-teal-heart transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !!oauthLoading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-heart text-bg-black font-bold text-base hover:shadow-xl hover:shadow-teal-heart/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
                    >
                      {loading ? (
                        <div className="w-5 h-5 rounded-full border-2 border-bg-black border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <span>Create Free Account</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                <p className="mt-5 text-center text-sm dark:text-gray-500 text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => onNavigate?.('login')}
                    className="text-teal-heart hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm dark:text-gray-600 text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-heart/60" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-heart/60" />
                  7-day free trial
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-heart/60" />
                  Cancel anytime
                </span>
              </div>
            </div>

            <div className="lg:hidden flex flex-col" style={{ minHeight: '320px' }}>
              <ImageCarousel />
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} darkMode={darkMode} />
    </div>
  );
}
