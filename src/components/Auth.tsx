import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bot } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPasswordRequest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (showResetPassword) {
        const { error } = await resetPasswordRequest(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Password reset link sent! Check your email.');
          setEmail('');
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) setError(error.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      style={{
        paddingTop: 'calc(1rem + var(--safe-area-inset-top))',
        paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom))'
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-6 shadow-2xl">
            <Bot className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
            AI Accounting Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Nice to meet you! How can I help you?
          </p>
        </div>

        <div className="backdrop-blur-sm rounded-3xl p-8 shadow-2xl bg-white border border-gray-200 dark:bg-black/40 dark:border-emerald-500/30">
          {!showResetPassword && (
            <div className="flex mb-6 rounded-full p-1 bg-gray-100 dark:bg-black/60">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {showResetPassword ? (
              <>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                    Reset Password
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter your email to receive a password reset link
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white border border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-black/60 dark:border-emerald-500/40 dark:text-white dark:placeholder-gray-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white border border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-black/60 dark:border-emerald-500/40 dark:text-white dark:placeholder-gray-500"
                      placeholder="Enter your name"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white border border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-black/60 dark:border-emerald-500/40 dark:text-white dark:placeholder-gray-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white border border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-black/60 dark:border-emerald-500/40 dark:text-white dark:placeholder-gray-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(true);
                        setError('');
                        setSuccess('');
                      }}
                      className="text-sm font-medium hover:underline text-emerald-600 dark:text-emerald-400"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Please wait...'
                : showResetPassword
                  ? 'Send Reset Link'
                  : isLogin
                    ? 'Login'
                    : 'Sign Up'
              }
            </button>

            {showResetPassword && (
              <button
                type="button"
                onClick={() => {
                  setShowResetPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="w-full text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Back to Login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
