import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { StripeProduct, getLicenseLimitsByProductName } from '../../stripe-config'
import { supabase } from '../../lib/supabase'
import { LicenseUsage } from '../../hooks/useLicenses'
import { Check, AlertCircle, ExternalLink } from 'lucide-react'
import { PageType } from '../../App'

interface SubscriptionCardProps {
  product: StripeProduct
  isCurrentPlan?: boolean
  onCheckout?: () => void
  onNavigate?: (page: PageType) => void
  currentProductName?: string
  usage: LicenseUsage
}

export function SubscriptionCard({ product, isCurrentPlan = false, onCheckout, onNavigate, currentProductName, usage }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [licenseError, setLicenseError] = useState<{ adminExcess: number; guestExcess: number } | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    setLicenseError(null)

    try {
      const targetLimits = getLicenseLimitsByProductName(product.name)
      if (targetLimits) {
        const activeAdminCount = usage.active_admin_count
        const activeGuestCount = usage.active_guest_count

        const adminExcess = activeAdminCount - targetLimits.adminLicenses
        const guestExcess = activeGuestCount - targetLimits.guestLicenses

        if (adminExcess > 0 || guestExcess > 0) {
          setLicenseError({
            adminExcess: Math.max(0, adminExcess),
            guestExcess: Math.max(0, guestExcess)
          })
          setLoading(false)
          return
        }
      }
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('Please sign in to subscribe')
      }

      setIsRedirecting(true)

      const makeCheckoutRequest = async (accessToken: string) => {
        return await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            price_id: product.priceId,
            mode: product.mode,
            success_url: `${window.location.origin}/?page=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/?page=pricing`
          })
        })
      }

      let response = await makeCheckoutRequest(session.access_token)

      if (response.status === 401) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError || !refreshedSession?.access_token) {
          throw new Error('Your session has expired. Please sign in again.')
        }

        response = await makeCheckoutRequest(refreshedSession.access_token)
      }

      const responseData = await response.json().catch(() => ({ error: 'Could not parse server response' }))

      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to create checkout session'

        if (response.status === 500) {
          if (errorMessage.includes('STRIPE_SECRET_KEY') || errorMessage.includes('stripe')) {
            throw new Error('Stripe payment system is not configured. Please set up your Stripe account at https://bolt.new/setup/stripe')
          }
          throw new Error('Payment system temporarily unavailable. Please try again in a moment.')
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.')
        } else {
          throw new Error(errorMessage)
        }
      }

      const { url } = responseData

      if (url) {
        onCheckout?.()
        window.location.href = url
      } else {
        throw new Error('Unable to start checkout. Please try again or contact support.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.')
      setIsRedirecting(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`relative ${isCurrentPlan ? 'ring-2 ring-yellow-400' : ''}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-yellow-400 to-white text-slate-900 px-3 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}
      
      <CardHeader className="text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">${product.price}</span>
          {product.interval && (
            <span className="text-gray-600 dark:text-gray-300">/{product.interval}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-center text-gray-600 dark:text-gray-300">{product.description}</p>

        {product.name === 'Reserve' && (
          <p className="text-sm text-center text-blue-600 dark:text-blue-400 font-medium">
            Additional Licenses for Reserve are only $5 more per month each.
          </p>
        )}

        {licenseError && (
          <Alert variant="error" className="text-left">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-2">Too many active licenses</p>
                <p className="text-sm mb-3">
                  You need to archive or deactivate the following licenses before downgrading:
                </p>
                <ul className="text-sm list-disc list-inside mb-3 space-y-1">
                  {licenseError.adminExcess > 0 && (
                    <li>{licenseError.adminExcess} Admin license{licenseError.adminExcess > 1 ? 's' : ''}</li>
                  )}
                  {licenseError.guestExcess > 0 && (
                    <li>{licenseError.guestExcess} Guest license{licenseError.guestExcess > 1 ? 's' : ''}</li>
                  )}
                </ul>
                {onNavigate && (
                  <Button
                    onClick={() => onNavigate('licenses')}
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    Manage Licenses
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        )}

        {loading && isRedirecting && (
          <p className="text-sm text-center text-blue-600 dark:text-blue-400 font-medium">
            Setting up your secure checkout session...
          </p>
        )}

        {error && (
          <div className="space-y-3">
            <Alert variant="error">
              {error}
            </Alert>
            {error.includes('bolt.new/setup/stripe') ? (
              <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                Contact your administrator to complete the Stripe setup
              </p>
            ) : (
              <Button
                onClick={handleSubscribe}
                loading={loading}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>
        )}

        {!error && !licenseError && (
          <Button
            onClick={handleSubscribe}
            loading={loading}
            disabled={isCurrentPlan}
            className="w-full"
          >
            {isCurrentPlan ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Current Plan
              </>
            ) : loading ? (
              isRedirecting ? 'Redirecting to secure checkout...' : 'Preparing checkout...'
            ) : (
              'Select Plan'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}