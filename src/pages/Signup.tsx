import React, { useEffect, useState } from 'react'
import { SignupForm } from '../components/auth/SignupForm'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { PageType } from '../App'
import Footer from '../components/landing/Footer'

interface SignupProps {
  onNavigate: (page: PageType) => void
}

export function Signup({ onNavigate }: SignupProps) {
  const [initialEmail, setInitialEmail] = useState<string | undefined>(undefined)
  const [inviteToken, setInviteToken] = useState<string | undefined>(undefined)
  const [entityName, setEntityName] = useState<string | undefined>(undefined)
  const [ownerName, setOwnerName] = useState<string | undefined>(undefined)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const inviteTokenParam = params.get('invite_token')
    const entityNameParam = params.get('entity_name')
    const ownerNameParam = params.get('owner_name')

    if (emailParam) setInitialEmail(emailParam)
    if (inviteTokenParam) setInviteToken(inviteTokenParam)
    if (entityNameParam) setEntityName(entityNameParam)
    if (ownerNameParam) setOwnerName(ownerNameParam)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const handleSuccess = () => {
    onNavigate('dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <div className="flex-1 flex items-center justify-center py-12 pb-24 md:pb-80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img
                src={darkMode ? "/EZ_Logo_-_White.png" : "/EZ_Logo_-_Black.png"}
                alt="Easy Expense App Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
            {ownerName && entityName ? (
              <>Create your account to be added to {ownerName}'s {entityName} workspace</>
            ) : (
              <>Create your account</>
            )}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <button
              onClick={() => {
                const params = new URLSearchParams()
                if (initialEmail) params.set('email', initialEmail)
                if (inviteToken) params.set('invite_token', inviteToken)
                if (entityName) params.set('entity_name', entityName)
                if (ownerName) params.set('owner_name', ownerName)
                const queryString = params.toString()
                window.location.href = queryString ? `/?page=login&${queryString}` : '/?page=login'
              }}
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              sign in to your existing account
            </button>
          </p>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              {inviteToken ? 'Complete Your Invitation' : 'Get started'}
            </h3>
          </CardHeader>
          <CardContent>
            <SignupForm
              onSuccess={handleSuccess}
              initialEmail={initialEmail}
              inviteToken={inviteToken}
            />
          </CardContent>
        </Card>
        </div>
      </div>
      <Footer onNavigate={onNavigate} darkMode={darkMode} />
    </div>
  )
}