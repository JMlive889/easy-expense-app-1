import React from 'react'
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { PageType } from '../App'
import { ArrowLeft } from 'lucide-react'

interface ForgotPasswordProps {
  onNavigate: (page: PageType) => void
}

export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-6 shadow-xl">
            <span className="text-3xl font-bold text-white">EZ</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
            Forgot password?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Reset your password</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <ForgotPasswordForm />

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
