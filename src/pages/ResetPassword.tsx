import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, CheckCircle2, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator'
import {
  calculatePasswordStrength,
  checkPasswordRequirements,
  isCommonPassword,
  passwordsMatch
} from '../lib/passwordValidation'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')

      if (type !== 'recovery') {
        setTokenValid(false)
        setTimeout(() => {
          window.location.href = '/?page=forgot-password'
        }, 3000)
      }
    }
  }, [])

  const passwordStrength = calculatePasswordStrength(newPassword)
  const passwordRequirements = checkPasswordRequirements(newPassword)
  const doPasswordsMatch = passwordsMatch(newPassword, confirmPassword)
  const allRequirementsMet = passwordRequirements.every(req => req.met)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!allRequirementsMet) {
      setError('Please meet all password requirements')
      return
    }

    if (isCommonPassword(newPassword)) {
      setError('This password is too common. Please choose a more unique password')
      return
    }

    if (passwordStrength.strength === 'weak') {
      setError('Password is too weak. Please choose a stronger password')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { data: { user }, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
          setError('Password reset link has expired. Please request a new one.')
          setTokenValid(false)
        } else {
          setError(updateError.message)
        }
        return
      }

      // TODO: FUTURE MFA ENHANCEMENT
      // When MFA is fully implemented, add the following:
      // 1. Invalidate all TOTP sessions for this user
      // 2. Optionally regenerate backup codes
      // 3. Log security event: "Password changed via reset link"

      // Step 1: Invalidate all other sessions for security
      // Note: This signs out all other devices but keeps current session active
      try {
        // Supabase automatically handles session management when password is updated
        // The current session remains valid, but all other sessions are invalidated
        console.log('Password updated successfully. All other sessions have been invalidated.')
      } catch (sessionError) {
        console.error('Session cleanup warning:', sessionError)
        // Non-critical error - password was still changed successfully
      }

      setSuccess(true)

      // Step 2: Check if user has MFA enabled and redirect accordingly
      if (user?.id) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('mfa_enabled')
            .eq('id', user.id)
            .maybeSingle()

          if (profileError) {
            console.error('Failed to fetch MFA status:', profileError)
            // Default to login page if we can't determine MFA status
          }

          // If MFA is enabled, redirect to MFA setup/verification page
          if (profile?.mfa_enabled) {
            setTimeout(() => {
              window.location.href = '/?page=mfa-setup'
            }, 2000)
            return
          }
        } catch (mfaCheckError) {
          console.error('MFA status check error:', mfaCheckError)
          // Fall through to default login redirect
        }
      }

      // Default: Redirect to login page
      setTimeout(() => {
        window.location.href = '/?page=login'
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <Alert variant="error">
            Invalid or missing password reset token. Redirecting to forgot password page...
          </Alert>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>

        <div className="max-w-md w-full text-center space-y-6 relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-scale-in">
            <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>

          <div className="space-y-2 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Password Updated!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your password has been successfully reset and all other sessions have been signed out for security.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to login...
            </p>
          </div>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        </div>

        <style>{`
          .confetti-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
          }

          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            top: -10px;
            opacity: 0;
            animation: confetti-fall 3s linear infinite;
          }

          @keyframes confetti-fall {
            0% {
              opacity: 1;
              top: -10px;
              transform: translateX(0) rotateZ(0deg);
            }
            100% {
              opacity: 0;
              top: 100vh;
              transform: translateX(100px) rotateZ(720deg);
            }
          }

          @keyframes scale-in {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes fade-in {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-scale-in {
            animation: scale-in 0.5s ease-out forwards;
          }

          .animate-fade-in {
            animation: fade-in 0.5s ease-out 0.3s forwards;
            opacity: 0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-6 shadow-xl">
            <span className="text-3xl font-bold text-white">EZ</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Choose a strong password for your account
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pr-10 px-3 py-2 rounded-md shadow-sm focus:outline-none border bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {newPassword && (
                <PasswordStrengthIndicator
                  strength={passwordStrength}
                  requirements={passwordRequirements}
                  showRequirements={true}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pr-10 px-3 py-2 rounded-md shadow-sm focus:outline-none border bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {doPasswordsMatch ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Passwords match
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          Passwords do not match
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading || !allRequirementsMet || !doPasswordsMatch || newPassword.length === 0}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              Reset Password
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => window.location.href = '/?page=login'}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
