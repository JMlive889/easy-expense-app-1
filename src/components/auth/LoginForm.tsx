import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Alert } from '../ui/Alert'
import { PageType } from '../../App'

interface LoginFormProps {
  onSuccess?: () => void
  onNavigate?: (page: PageType) => void
}

export function LoginForm({ onSuccess, onNavigate }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Provide specific error messages based on error type
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before logging in.')
        } else if (error.message.includes('rate limit')) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.')
        } else {
          throw error
        }
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
      
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="Enter your password"
        showPasswordToggle
      />
      
      <Button
        type="submit"
        loading={loading}
        className="w-full"
      >
        Sign In
      </Button>

      {onNavigate && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => onNavigate('forgot-password')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}
    </form>
  )
}