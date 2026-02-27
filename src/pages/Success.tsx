import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { useSubscription } from '../hooks/useSubscription'
import { CheckCircle } from 'lucide-react'
import { PageType } from '../App'

interface SuccessProps {
  onNavigate: (page: PageType) => void
}

export function Success({ onNavigate }: SuccessProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)
  const { refetch } = useSubscription()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('session_id')
    setSessionId(id)

    if (id) {
      // Refresh subscription data
      setTimeout(() => {
        refetch()
      }, 2000)

      // Auto-redirect countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            onNavigate('settings')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [refetch, onNavigate])

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full">
          <Alert variant="error">
            <p className="font-medium">Invalid session</p>
            <p className="mt-1">No payment session found. Please try again.</p>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => onNavigate('pricing')}>Return to Pricing</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Payment Successful!
            </h2>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Thank you for subscribing! Your payment has been processed and your subscription is now active.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Redirecting to your subscription settings in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
            </div>
            <div className="space-y-2 pt-2">
              <Button onClick={() => onNavigate('settings')} className="w-full">
                View My Subscription
              </Button>
              <Button onClick={() => onNavigate('dashboard')} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}