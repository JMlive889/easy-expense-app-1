import React, { useEffect, useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { PageType } from '../App'
import { Info, AlertCircle, Loader2 } from 'lucide-react'
import { useInvitation } from '../hooks/useInvitation'

interface LoginProps {
  onNavigate: (page: PageType) => void
}

export function Login({ onNavigate }: LoginProps) {
  const [entityName, setEntityName] = useState<string | undefined>(undefined)
  const [ownerName, setOwnerName] = useState<string | undefined>(undefined)
  const [inviteToken, setInviteToken] = useState<string | undefined>(undefined)
  const [initialEmail, setInitialEmail] = useState<string | undefined>(undefined)

  const { invitation, loading: invitationLoading, error: invitationError } = useInvitation(inviteToken || null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const entityNameParam = params.get('entity_name')
    const ownerNameParam = params.get('owner_name')
    const inviteTokenParam = params.get('invite_token')
    const emailParam = params.get('email')

    if (entityNameParam) setEntityName(entityNameParam)
    if (ownerNameParam) setOwnerName(ownerNameParam)
    if (inviteTokenParam) setInviteToken(inviteTokenParam)
    if (emailParam) setInitialEmail(emailParam)
  }, [])

  useEffect(() => {
    if (invitation) {
      setEntityName(invitation.entityName)
      setOwnerName(invitation.ownerName)
      if (!initialEmail) {
        setInitialEmail(invitation.invitedEmail)
      }
    }
  }, [invitation])

  const handleSuccess = () => {
    onNavigate('dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-6 shadow-xl">
            <span className="text-3xl font-bold text-white">EZ</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
            {ownerName && entityName ? (
              <>Sign in to join {ownerName}'s {entityName} workspace</>
            ) : (
              <>Sign in to your account</>
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
                window.location.href = queryString ? `/?page=signup&${queryString}` : '/?page=signup'
              }}
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              create a new account
            </button>
          </p>
        </div>

        {invitationLoading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Loading invitation details...
                </p>
              </div>
            </div>
          </div>
        )}

        {invitationError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Invitation Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {invitationError}
                </p>
              </div>
            </div>
          </div>
        )}

        {!invitationLoading && !invitationError && ownerName && entityName && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  You've been invited to join {ownerName}'s workspace
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">
                  To be associated with <span className="font-medium">{entityName}</span>'s account, please create an account or sign in with your current account.
                </p>
                {initialEmail && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                    Invited email: <span className="font-medium">{initialEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Welcome back</h3>
          </CardHeader>
          <CardContent>
            <LoginForm onSuccess={handleSuccess} onNavigate={onNavigate} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}