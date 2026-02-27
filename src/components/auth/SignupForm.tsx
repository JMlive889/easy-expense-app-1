import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Alert } from '../ui/Alert'

interface SignupFormProps {
  onSuccess?: () => void
  initialEmail?: string
  inviteToken?: string
}

export function SignupForm({ onSuccess, initialEmail, inviteToken }: SignupFormProps) {
  const [email, setEmail] = useState(initialEmail || '')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (signUpError) {
        // Provide specific error messages based on error type
        if (signUpError.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please log in instead.')
        } else if (signUpError.message.includes('Password should be')) {
          throw new Error('Password must be at least 6 characters long.')
        } else if (signUpError.message.includes('valid email')) {
          throw new Error('Please enter a valid email address.')
        } else {
          throw signUpError
        }
      }

      if (inviteToken && authData.user) {
        const { error: updateError } = await supabase
          .from('licenses')
          .update({
            user_id: authData.user.id,
            status: 'active',
            accepted_at: new Date().toISOString()
          })
          .eq('invitation_token', inviteToken)
          .eq('invited_email', email.toLowerCase())

        if (updateError) {
          console.error('Failed to update license:', updateError)
          throw new Error('Account created but failed to activate invitation. Please contact support.')
        }
      }

      if (authData.user) {
        let profileReady = false
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500))
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', authData.user.id)
            .maybeSingle()
          if (profileData) {
            profileReady = true
            break
          }
        }
        if (!profileReady) {
          throw new Error('Account created but profile setup is taking longer than expected. Please try logging in.')
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
        label="Full Name"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        placeholder="Enter your full name"
      />
      
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
        minLength={6}
        showPasswordToggle
      />
      
      <Button
        type="submit"
        loading={loading}
        className="w-full"
      >
        Sign Up
      </Button>
    </form>
  )
}