import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Alert } from '../ui/Alert'
import { CheckCircle } from 'lucide-react'

interface ForgotPasswordFormProps {
  onSuccess?: () => void
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { resetPasswordRequest } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await resetPasswordRequest(email)

      if (error) {
        // Provide specific error messages based on error type
        if (error.message.includes('rate limit')) {
          throw new Error('Too many reset requests. Please wait a few minutes and try again.')
        } else if (error.message.includes('invalid email')) {
          throw new Error('Please enter a valid email address.')
        } else {
          throw error
        }
      }

      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-500/20 p-3">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Check your email
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If an account exists with this email, we sent a password reset link to your inbox.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Enter your email"
      />

      <Button
        type="submit"
        loading={loading}
        className="w-full"
      >
        Send reset link
      </Button>
    </form>
  )
}
